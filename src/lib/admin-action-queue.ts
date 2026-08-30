import "server-only";

import { cache } from "react";
import {
  adminPendingPaymentWhere,
  getPendingPaymentDueState,
} from "@/lib/admin-pending-payments";
import { prisma } from "@/lib/prisma";
import type {
  AdminActionQueue,
  AdminActionQueueEntry,
} from "@/lib/admin-action-queue-types";

export type { AdminActionQueue, AdminActionQueueEntry };

/** Pending registration reviews: awaiting photo approval (VLY may be blank). */
const REGISTRATION_REVIEW_WHERE = {
  userId: null,
  active: true,
  registrationReviewStatus: "PENDING" as const,
  // Avoid `{ not: null }` / `NOT: [{ vlyNumber: null }]` — breaks with some Prisma clients
  // after vlyNumber became optional. Require a submitted photo path instead.
  vlyMembershipPhotoUrl: { startsWith: "/" },
};

const KIT_PROOF_SUBMITTED_WHERE = {
  paymentStatus: "PROOF_SUBMITTED" as const,
  proofScreenshotUrl: { not: null },
};

function coachPaymentOverdueWhere(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return {
    status: "PENDING" as const,
    amount: { gt: 0 },
    OR: [
      { year: { lt: currentYear } },
      { year: currentYear, month: { lt: currentMonth } },
    ],
  };
}

export async function queryAdminActionQueue(): Promise<AdminActionQueue> {
  const now = new Date();

  const [
    registrationReviews,
    registrationCount,
    pendingPayments,
    paymentCount,
    kitPaymentProofs,
    kitPaymentProofCount,
    merchandisePaymentProofs,
    merchandisePaymentProofCount,
    coachOverduePayments,
    coachOverdueCount,
    coachingApplications,
    coachingApplicationCount,
    trialsApplications,
    trialsApplicationCount,
    trialSessionSignups,
    trialSessionSignupCount,
  ] = await Promise.all([
    prisma.clubMember.findMany({
      where: REGISTRATION_REVIEW_WHERE,
      orderBy: { registrationPhotoSubmittedAt: "asc" },
      take: 4,
      select: { name: true, vlyNumber: true },
    }),
    prisma.clubMember.count({ where: REGISTRATION_REVIEW_WHERE }),
    prisma.payment.findMany({
      where: adminPendingPaymentWhere(),
      include: {
        user: { select: { name: true } },
      },
      orderBy: [
        { proofSubmittedAt: "desc" },
        { dueDate: "asc" },
        { createdAt: "asc" },
      ],
      take: 4,
    }),
    prisma.payment.count({ where: adminPendingPaymentWhere() }),
    prisma.kitOrder.findMany({
      where: KIT_PROOF_SUBMITTED_WHERE,
      orderBy: { proofSubmittedAt: "desc" },
      take: 4,
      select: { firstName: true, lastName: true },
    }),
    prisma.kitOrder.count({ where: KIT_PROOF_SUBMITTED_WHERE }),
    prisma.merchandiseOrder.findMany({
      where: KIT_PROOF_SUBMITTED_WHERE,
      orderBy: { proofSubmittedAt: "desc" },
      take: 4,
      select: { firstName: true, lastName: true },
    }),
    prisma.merchandiseOrder.count({ where: KIT_PROOF_SUBMITTED_WHERE }),
    prisma.coachSalaryPayment.findMany({
      where: coachPaymentOverdueWhere(now),
      include: {
        clubMember: { select: { name: true } },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      take: 4,
    }),
    prisma.coachSalaryPayment.count({
      where: coachPaymentOverdueWhere(now),
    }),
    prisma.coachingApplication.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: { fullName: true, qualificationLevel: true },
    }),
    prisma.coachingApplication.count({ where: { status: "NEW" } }),
    prisma.trialsApplication.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: { fullName: true, tryingOutFor: true },
    }),
    prisma.trialsApplication.count({ where: { status: "NEW" } }),
    prisma.trialSessionSignup.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: {
        displayName: true,
        trialSession: { select: { title: true } },
      },
    }),
    prisma.trialSessionSignup.count({ where: { status: "PENDING" } }),
  ]);

  const pendingPaymentDueDates = await prisma.payment.findMany({
    where: adminPendingPaymentWhere(),
    select: { dueDate: true },
  });

  const paymentOverdueCount = pendingPaymentDueDates.filter(
    (payment) =>
      getPendingPaymentDueState(payment.dueDate?.toISOString() ?? null, now) ===
      "overdue",
  ).length;

  const entries: AdminActionQueueEntry[] = [];

  if (registrationCount > 0) {
    entries.push({
      kind: "registration",
      href: "/admin/registration-reviews",
      title: "Member registrations",
      summary:
        registrationCount === 1
          ? "1 member waiting for VLY photo approval"
          : `${registrationCount} members waiting for VLY photo approval`,
      count: registrationCount,
      previews: registrationReviews.map(
        (review) =>
          `${review.name} · ${review.vlyNumber ?? "VLY pending"}`,
      ),
    });
  }

  if (paymentCount > 0) {
    entries.push({
      kind: "payment",
      href: "/admin/payments",
      title: "Membership payments",
      summary:
        paymentCount === 1
          ? "1 transfer screenshot to verify"
          : `${paymentCount} transfer screenshots to verify`,
      count: paymentCount,
      urgentCount: paymentOverdueCount > 0 ? paymentOverdueCount : undefined,
      previews: pendingPayments.map((payment) => payment.user.name),
    });
  }

  if (kitPaymentProofCount > 0) {
    entries.push({
      kind: "kit-payment",
      href: "/admin/kit-orders",
      title: "Kit payments",
      summary:
        kitPaymentProofCount === 1
          ? "1 kit payment receipt to verify"
          : `${kitPaymentProofCount} kit payment receipts to verify`,
      count: kitPaymentProofCount,
      previews: kitPaymentProofs.map(
        (order) => `${order.firstName} ${order.lastName}`.trim(),
      ),
    });
  }

  if (merchandisePaymentProofCount > 0) {
    entries.push({
      kind: "merchandise-payment",
      href: "/admin/merchandise-orders",
      title: "Merchandise payments",
      summary:
        merchandisePaymentProofCount === 1
          ? "1 merchandise payment receipt to verify"
          : `${merchandisePaymentProofCount} merchandise payment receipts to verify`,
      count: merchandisePaymentProofCount,
      previews: merchandisePaymentProofs.map((order) =>
        `${order.firstName} ${order.lastName}`.trim(),
      ),
    });
  }

  if (coachOverdueCount > 0) {
    entries.push({
      kind: "coach-payment",
      href: "/admin/coach-payments",
      title: "Coach payments",
      summary:
        coachOverdueCount === 1
          ? "1 overdue coach payment"
          : `${coachOverdueCount} overdue coach payments`,
      count: coachOverdueCount,
      urgentCount: coachOverdueCount,
      previews: coachOverduePayments.map(
        (payment) => payment.clubMember.name,
      ),
    });
  }

  if (coachingApplicationCount > 0) {
    entries.push({
      kind: "coaching-application",
      href: "/admin/coaching-applications",
      title: "Coaching applications",
      summary:
        coachingApplicationCount === 1
          ? "1 new coaching application"
          : `${coachingApplicationCount} new coaching applications`,
      count: coachingApplicationCount,
      previews: coachingApplications.map((application) => application.fullName),
    });
  }

  if (trialsApplicationCount > 0) {
    entries.push({
      kind: "trials-application",
      href: "/admin/trials-applications",
      title: "Signups",
      summary:
        trialsApplicationCount === 1
          ? "1 new signup"
          : `${trialsApplicationCount} new signups`,
      count: trialsApplicationCount,
      previews: trialsApplications.map((application) => application.fullName),
    });
  }

  if (trialSessionSignupCount > 0) {
    entries.push({
      kind: "trial-session-signup",
      href: "/admin/one-off-sessions",
      title: "Session requests",
      summary:
        trialSessionSignupCount === 1
          ? "1 attendee waiting for approval"
          : `${trialSessionSignupCount} attendees waiting for approval`,
      count: trialSessionSignupCount,
      previews: trialSessionSignups.map(
        (signup) => `${signup.displayName} · ${signup.trialSession.title}`,
      ),
    });
  }

  const badgeCounts: Record<string, number> = {};
  if (registrationCount > 0) {
    badgeCounts["/admin/registration-reviews"] = registrationCount;
  }
  if (paymentCount > 0) {
    badgeCounts["/admin/payments"] = paymentCount;
  }
  if (kitPaymentProofCount > 0) {
    badgeCounts["/admin/kit-orders"] = kitPaymentProofCount;
  }
  if (merchandisePaymentProofCount > 0) {
    badgeCounts["/admin/merchandise-orders"] = merchandisePaymentProofCount;
  }
  if (coachOverdueCount > 0) {
    badgeCounts["/admin/coach-payments"] = coachOverdueCount;
  }
  if (coachingApplicationCount > 0) {
    badgeCounts["/admin/coaching-applications"] = coachingApplicationCount;
  }
  if (trialsApplicationCount > 0) {
    badgeCounts["/admin/trials-applications"] = trialsApplicationCount;
  }
  if (trialSessionSignupCount > 0) {
    badgeCounts["/admin/one-off-sessions"] = trialSessionSignupCount;
  }

  return {
    entries,
    totalCount:
      registrationCount +
      paymentCount +
      kitPaymentProofCount +
      merchandisePaymentProofCount +
      coachOverdueCount +
      coachingApplicationCount +
      trialsApplicationCount +
      trialSessionSignupCount,
    badgeCounts,
  };
}

export const getAdminActionQueue = cache(queryAdminActionQueue);
