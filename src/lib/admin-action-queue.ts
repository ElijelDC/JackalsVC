import "server-only";

import { cache } from "react";
import {
  adminPendingPaymentWhere,
  getPendingPaymentDueState,
} from "@/lib/admin-pending-payments";
import { prisma } from "@/lib/prisma";

export type AdminActionQueueEntry = {
  kind: "registration" | "payment" | "coach-payment" | "coaching-application";
  href: string;
  title: string;
  summary: string;
  count: number;
  urgentCount?: number;
  previews: string[];
};

export type AdminActionQueue = {
  entries: AdminActionQueueEntry[];
  totalCount: number;
  badgeCounts: Record<string, number>;
};

const REGISTRATION_REVIEW_WHERE = {
  userId: null,
  active: true,
  registrationReviewStatus: "PENDING" as const,
  vlyMembershipPhotoUrl: { not: null },
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

export const getAdminActionQueue = cache(async (): Promise<AdminActionQueue> => {
  const now = new Date();

  const [
    registrationReviews,
    registrationCount,
    pendingPayments,
    paymentCount,
    coachOverduePayments,
    coachOverdueCount,
    coachingApplications,
    coachingApplicationCount,
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
        (review) => `${review.name} · ${review.vlyNumber}`,
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

  const badgeCounts: Record<string, number> = {};
  if (registrationCount > 0) {
    badgeCounts["/admin/registration-reviews"] = registrationCount;
  }
  if (paymentCount > 0) {
    badgeCounts["/admin/payments"] = paymentCount;
  }
  if (coachOverdueCount > 0) {
    badgeCounts["/admin/coach-payments"] = coachOverdueCount;
  }
  if (coachingApplicationCount > 0) {
    badgeCounts["/admin/coaching-applications"] = coachingApplicationCount;
  }

  return {
    entries,
    totalCount:
      registrationCount +
      paymentCount +
      coachOverdueCount +
      coachingApplicationCount,
    badgeCounts,
  };
});
