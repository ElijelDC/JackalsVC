import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  buildInstallments,
  createMembershipPricing,
  formatPaymentScheduleLabel,
  getClubMembershipSeasonEndDate,
  isStudentMembershipPlanName,
  planInstallmentAmounts,
  validateMembershipPlanPrice,
  type PaymentSchedule,
} from "@/lib/membership-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  saveStudentIdProofFile,
  validateStudentIdProofFile,
} from "@/lib/student-id-proof";
import { createMembershipPayments } from "@/lib/sumup-reconcile";
import { membershipSubscribeSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function parseSubscribeRequest(request: Request): Promise<
  | {
      ok: true;
      planId: string;
      paymentSchedule: PaymentSchedule;
      studentIdProof: File | null;
    }
  | { ok: false; response: Response }
> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const planId = form.get("planId");
    const paymentSchedule = form.get("paymentSchedule");
    const studentIdProof = form.get("studentIdProof");
    const parsed = membershipSubscribeSchema.safeParse({
      planId,
      paymentSchedule,
    });
    if (!parsed.success) {
      return {
        ok: false,
        response: jsonError(
          parsed.error.issues[0]?.message ?? "Invalid membership details",
          400,
        ),
      };
    }
    return {
      ok: true,
      planId: parsed.data.planId,
      paymentSchedule: parsed.data.paymentSchedule as PaymentSchedule,
      studentIdProof: studentIdProof instanceof File ? studentIdProof : null,
    };
  }

  const { data, response } = await parseJsonBody(
    request,
    membershipSubscribeSchema,
  );
  if (response || !data) {
    return { ok: false, response: response! };
  }
  return {
    ok: true,
    planId: data.planId,
    paymentSchedule: data.paymentSchedule as PaymentSchedule,
    studentIdProof: null,
  };
}

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const parsed = await parseSubscribeRequest(request);
  if (!parsed.ok) return parsed.response;

  try {
    const plan = await prisma.membershipPlan.findFirst({
      where: { id: parsed.planId, active: true },
    });

    if (!plan) return jsonError("Membership is not available right now", 404);

    const isStudentPlan = isStudentMembershipPlanName(plan.name);
    let studentIdProofUrl: string | null = null;
    let studentIdProofSubmittedAt: Date | null = null;

    if (isStudentPlan) {
      if (!parsed.studentIdProof) {
        return jsonError(
          "Upload a photo of your student or under-18 ID to use the Student/U18 rate.",
          400,
        );
      }
      const fileError = validateStudentIdProofFile(parsed.studentIdProof);
      if (fileError) return jsonError(fileError, 400);
      studentIdProofUrl = await saveStudentIdProofFile(
        session!.user.id,
        parsed.studentIdProof,
      );
      studentIdProofSubmittedAt = new Date();
    }

    const pricing = createMembershipPricing(
      plan.price,
      plan.durationMonths,
      planInstallmentAmounts(plan),
    );
    const priceError = validateMembershipPlanPrice(
      plan.price,
      plan.durationMonths,
    );
    if (priceError) {
      return jsonError(
        "Membership pricing is misconfigured. Please contact the club.",
        503,
      );
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

    const schedule = parsed.paymentSchedule;
    const startDate = new Date();
    const endDate = getClubMembershipSeasonEndDate();

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
          studentIdProofUrl,
          studentIdProofSubmittedAt,
          studentIdReviewStatus: isStudentPlan ? "PENDING" : null,
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

      await tx.clubMember.updateMany({
        where: {
          userId: session!.user.id,
          rosterRole: "PLAYER",
          playerPaymentType: "PAYG",
        },
        data: { playerPaymentType: "MEMBERSHIP" },
      });

      return created;
    });

    const memberName = session!.user.name ?? "A member";
    await notifyAdmins({
      subject: isStudentPlan
        ? `Student/U18 membership signup — ${memberName}`
        : `New membership signup — ${memberName}`,
      content: {
        heading: isStudentPlan
          ? "Student/U18 membership needs ID review"
          : "New membership signup",
        paragraphs: isStudentPlan
          ? [
              `${memberName} chose Student/U18 and uploaded ID proof. Review the document, then approve or decline the student rate.`,
            ]
          : [
              `${memberName} chose a membership plan and a payment schedule. Their first payment is pending.`,
            ],
        details: [
          { label: "Member", value: memberName },
          { label: "Plan", value: plan.name },
          { label: "Schedule", value: scheduleLabel },
        ],
        imageUrl: studentIdProofUrl
          ? emailSiteUrl(studentIdProofUrl)
          : undefined,
        imageAlt: studentIdProofUrl ? "Submitted student / U18 ID" : undefined,
        ctaUrl: emailSiteUrl(
          isStudentPlan
            ? "/admin/student-id-reviews"
            : "/admin/members?focus=subscription",
        ),
        ctaLabel: isStudentPlan ? "Review student ID" : "View subscriptions",
      },
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
