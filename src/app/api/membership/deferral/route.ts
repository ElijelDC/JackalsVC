import { NextResponse } from "next/server";
import { startOfDay } from "date-fns";
import { auth } from "@/auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  assessMembershipPaymentAccess,
  isInstallmentSchedule,
} from "@/lib/membership-overdue";
import { prisma } from "@/lib/prisma";
import { paymentDeferralRequestSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("Sign in required", 401);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    paymentDeferralRequestSchema,
  );
  if (parseError || !data) return parseError!;

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.user.id,
      endDate: { gt: new Date() },
    },
    include: {
      payments: {
        orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!membership) {
    return jsonError("No active membership found", 404);
  }

  if (!isInstallmentSchedule(membership.paymentSchedule)) {
    return jsonError("Payment extensions only apply to monthly or instalment plans", 400);
  }

  const paymentAccess = assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: membership.paymentOverdueOverride,
    paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
    payments: membership.payments,
  });

  if (!paymentAccess.isPastDue && !paymentAccess.isOverdue) {
    return jsonError("You can request an extension once a payment is past due", 400);
  }

  if (paymentAccess.hasOverride) {
    return jsonError("An admin override is already active on your membership", 400);
  }

  const requestedDueDate = startOfDay(new Date(data.dueDate));
  const today = startOfDay(new Date());

  if (requestedDueDate <= today) {
    return jsonError("Choose a pay-by date in the future", 400);
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: {
      paymentDeferralExcuse: data.excuse.trim(),
      paymentDeferralDueDate: requestedDueDate,
      paymentDeferralRequestedAt: new Date(),
    },
    select: {
      paymentDeferralExcuse: true,
      paymentDeferralDueDate: true,
      paymentDeferralRequestedAt: true,
    },
  });

  return NextResponse.json({
    deferral: {
      excuse: updated.paymentDeferralExcuse,
      dueDate: updated.paymentDeferralDueDate?.toISOString() ?? null,
      requestedAt: updated.paymentDeferralRequestedAt?.toISOString() ?? null,
    },
  });
}
