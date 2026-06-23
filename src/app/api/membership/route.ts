import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  buildInstallments,
  createMembershipPricing,
  formatPaymentScheduleLabel,
  validateMembershipPlanPrice,
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
      where: { id: data.planId, active: true },
    });

    if (!plan) return jsonError("Membership is not available right now", 404);

    const pricing = createMembershipPricing(plan.price, plan.durationMonths);
    const priceError = validateMembershipPlanPrice(plan.price, plan.durationMonths);
    if (priceError) {
      return jsonError("Membership pricing is misconfigured. Please contact the club.", 503);
    }

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

    await prisma.payment.deleteMany({
      where: {
        userId: session!.user.id,
        membershipId: null,
        status: "PENDING",
      },
    });

    const schedule = data.paymentSchedule as PaymentSchedule;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const installments = buildInstallments(schedule, pricing, startDate);
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
        planName: plan.name,
        scheduleLabel,
        installments,
      });

      return created;
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch (error) {
    console.error("Membership creation failed:", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return jsonError(
        "Your payment schedule is already set. View your payment status to pay by bank transfer.",
        409,
      );
    }

    return jsonError("Failed to create membership", 500);
  }
}
