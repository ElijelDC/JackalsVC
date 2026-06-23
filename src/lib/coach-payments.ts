import { endOfMonth, startOfMonth } from "date-fns";
import { enrichEventRecords } from "@/lib/event-enrichment";
import {
  calculateCoachSalaryAmount,
  COACH_SESSION_RATE_EUR,
  type CoachMonthPayrollBreakdown,
  type CoachPaymentItem,
  type CoachPaymentStatus,
  type CoachTrainingPayItem,
} from "@/lib/coach-payments-config";
import { normalizeSignupStatus } from "@/lib/training-attendance-config";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

export type {
  CoachMonthPayrollBreakdown,
  CoachPaymentItem,
  CoachTrainingPayItem,
} from "@/lib/coach-payments-config";

const EMPTY_BREAKDOWN: CoachMonthPayrollBreakdown = {
  sessions: [],
  billableCount: 0,
  cantAttendCount: 0,
  cancelledCount: 0,
  totalScheduled: 0,
};

export async function getCoachMonthPayroll(
  coachUserId: string,
  trainingTeamKey: string,
  year: number,
  month: number,
): Promise<CoachMonthPayrollBreakdown> {
  const session = await prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey,
    },
    select: { id: true },
  });

  if (!session) return EMPTY_BREAKDOWN;

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { startDate: "asc" },
  });

  if (events.length === 0) return EMPTY_BREAKDOWN;

  const enriched = await enrichEventRecords(events);
  const eventIds = enriched.map((event) => event.id);

  const signups = await prisma.eventSignup.findMany({
    where: { userId: coachUserId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });
  const signupMap = new Map(signups.map((signup) => [signup.eventId, signup.status]));

  const sessions: CoachTrainingPayItem[] = enriched.map((event) => {
    const cancelled = event.occurrenceCancelled;
    const coachStatus = cancelled
      ? ("CANCELLED" as const)
      : normalizeSignupStatus(signupMap.get(event.id));
    const payable = !cancelled && coachStatus !== "NOT_ATTENDING";

    return {
      eventId: event.id,
      startDate: event.startDate.toISOString(),
      location: event.location,
      cancelled,
      coachStatus,
      payable,
      amount: payable ? COACH_SESSION_RATE_EUR : 0,
    };
  });

  const billableCount = sessions.filter((item) => item.payable).length;
  const cantAttendCount = sessions.filter(
    (item) => !item.cancelled && item.coachStatus === "NOT_ATTENDING",
  ).length;
  const cancelledCount = sessions.filter((item) => item.cancelled).length;

  return {
    sessions,
    billableCount,
    cantAttendCount,
    cancelledCount,
    totalScheduled: sessions.length,
  };
}

export async function countSquadTrainingSessionsInMonth(
  trainingTeamKey: string,
  year: number,
  month: number,
) {
  const session = await prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey,
    },
    select: { id: true },
  });

  if (!session) return 0;

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: session.id,
      startDate: { gte: monthStart, lte: monthEnd },
    },
  });

  const enriched = await enrichEventRecords(events);
  return enriched.filter((event) => !event.occurrenceCancelled).length;
}

export async function ensureCoachSalaryPayment(
  clubMemberId: string,
  trainingTeamKey: string,
  year: number,
  month: number,
  coachUserId?: string | null,
) {
  const payroll = coachUserId
    ? await getCoachMonthPayroll(coachUserId, trainingTeamKey, year, month)
    : null;

  const ratePerSession = COACH_SESSION_RATE_EUR;
  const sessionCount = payroll
    ? payroll.billableCount
    : await countSquadTrainingSessionsInMonth(trainingTeamKey, year, month);
  const amount = calculateCoachSalaryAmount(sessionCount, ratePerSession);

  const existing = await prisma.coachSalaryPayment.findUnique({
    where: {
      clubMemberId_year_month: { clubMemberId, year, month },
    },
  });

  if (existing) {
    if (existing.status === "PENDING" && payroll) {
      return prisma.coachSalaryPayment.update({
        where: { id: existing.id },
        data: { sessionCount, amount, ratePerSession },
      });
    }
    return existing;
  }

  return prisma.coachSalaryPayment.create({
    data: {
      clubMemberId,
      year,
      month,
      sessionCount,
      ratePerSession,
      amount,
      status: "PENDING",
    },
  });
}

function serializePayment(
  payment: {
    id: string;
    year: number;
    month: number;
    sessionCount: number;
    ratePerSession: number;
    amount: number;
    status: string;
    invoiceScreenshotUrl: string | null;
    paidAt: Date | null;
    notes: string | null;
  },
  breakdown: CoachMonthPayrollBreakdown,
): CoachPaymentItem {
  return {
    id: payment.id,
    year: payment.year,
    month: payment.month,
    sessionCount: payment.sessionCount,
    ratePerSession: payment.ratePerSession,
    amount: payment.amount,
    status: payment.status as CoachPaymentStatus,
    invoiceScreenshotUrl: payment.invoiceScreenshotUrl,
    paidAt: payment.paidAt?.toISOString() ?? null,
    notes: payment.notes,
    breakdown,
  };
}

export async function getCoachSalaryPayments(
  clubMemberId: string,
  trainingTeamKey: string,
  coachUserId?: string | null,
  options: { monthsBack?: number; monthsAhead?: number } = {},
) {
  const monthsBack = options.monthsBack ?? 12;
  const monthsAhead = options.monthsAhead ?? 3;
  const now = new Date();
  const periods: { year: number; month: number }[] = [];

  for (let offset = monthsAhead; offset >= -monthsBack; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    periods.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  const payments = await Promise.all(
    periods.map(async ({ year, month }) => {
      const breakdown = coachUserId
        ? await getCoachMonthPayroll(coachUserId, trainingTeamKey, year, month)
        : EMPTY_BREAKDOWN;

      const payment = await ensureCoachSalaryPayment(
        clubMemberId,
        trainingTeamKey,
        year,
        month,
        coachUserId,
      );

      return serializePayment(payment, breakdown);
    }),
  );

  return payments;
}

export async function getCoachSalaryPaymentById(
  paymentId: string,
  coachUserId?: string | null,
  trainingTeamKey?: string | null,
) {
  const payment = await prisma.coachSalaryPayment.findUnique({
    where: { id: paymentId },
    include: {
      clubMember: { select: { userId: true, trainingTeamKey: true } },
    },
  });

  if (!payment) return null;

  const userId = coachUserId ?? payment.clubMember.userId;
  const teamKey = trainingTeamKey ?? payment.clubMember.trainingTeamKey;

  const breakdown =
    userId && teamKey
      ? await getCoachMonthPayroll(userId, teamKey, payment.year, payment.month)
      : EMPTY_BREAKDOWN;

  return serializePayment(payment, breakdown);
}
