import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  buildInstallments,
  formatPaymentScheduleLabel,
  SEASON_DURATION_MONTHS,
  type PaymentSchedule,
} from "@/lib/membership-config";
import { prisma } from "@/lib/prisma";
import { createMembershipPayments } from "@/lib/sumup-reconcile";
import { membershipSubscribeSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { data, response } = await parseJsonBody(request, membershipSubscribeSchema);
  if (response || !data) return response!;

  try {
    const plan = await prisma.membershipPlan.findFirst({
      where: { active: true },
    });

    if (!plan) return jsonError("Membership is not available right now", 404);

    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: session!.user.id,
        endDate: { gt: new Date() },
      },
    });

    if (existingMembership) {
      return jsonError(
        "Your payment schedule is already set and cannot be changed.",
        409,
      );
    }

    const schedule = data.paymentSchedule as PaymentSchedule;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + SEASON_DURATION_MONTHS);

    const installments = buildInstallments(schedule, startDate);
    const scheduleLabel = formatPaymentScheduleLabel(schedule);

    const membership = await prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          userId: session!.user.id,
          planId: plan.id,
          paymentSchedule: schedule,
          endDate,
          status: "PENDING_PAYMENT",
        },
        include: { plan: true },
      });

      await createMembershipPayments(tx, {
        userId: session!.user.id,
        memberName: session!.user.name ?? "Member",
        membershipId: created.id,
        scheduleLabel,
        installments,
      });

      return created;
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error("Membership creation failed:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return jsonError(
          "Your payment schedule is already set. View your payment status to pay by bank transfer.",
          409,
        );
      }

      if (process.env.NODE_ENV === "development") {
        return jsonError(`Failed to create membership: ${error.message}`, 500);
      }
    }

    return jsonError("Failed to create membership", 500);
  }
}
