import { endOfMonth, startOfMonth } from "date-fns";
import type { EnrichedEvent } from "@/lib/event-enrichment";
import { enrichEventRecords } from "@/lib/event-enrichment";
import {
  calculateCoachSalaryAmount,
  COACH_SESSION_RATE_EUR,
  coachPaymentBillableSessionCount,
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
  expectedCount: 0,
  cantAttendCount: 0,
  cancelledCount: 0,
  totalScheduled: 0,
};

function normalizeTeamKeys(keys: string | string[] | null | undefined): string[] {
  const list = Array.isArray(keys) ? keys : keys ? [keys] : [];
  return [...new Set(list.filter(Boolean))];
}


/* ── Shared event cache for batch payroll computation ─────── */

type EventCache = Map<string, EnrichedEvent[]>;

export async function preloadTeamEvents(
  trainingTeamKeys: string[],
  monthsBack: number,
  monthsAhead: number,
): Promise<EventCache> {
  const now = new Date();
  const rangeStart = startOfMonth(
    new Date(now.getFullYear(), now.getMonth() - monthsBack, 1),
  );
  const rangeEnd = endOfMonth(
    new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1),
  );

  const sessions = await prisma.trainingSession.findMany({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey: { in: trainingTeamKeys },
    },
    select: { id: true, trainingTeamKey: true },
  });

  if (sessions.length === 0) return new Map();

  const sessionIdToTeam = new Map(
    sessions.map((s) => [s.id, s.trainingTeamKey!]),
  );

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: { in: sessions.map((s) => s.id) },
      startDate: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: { startDate: "asc" },
  });

  const enriched = await enrichEventRecords(events);

  const cache: EventCache = new Map();
  for (const event of enriched) {
    const teamKey = sessionIdToTeam.get(event.trainingSessionId!);
    if (!teamKey) continue;
    const monthKey = `${teamKey}:${event.startDate.getFullYear()}-${event.startDate.getMonth() + 1}`;
    const list = cache.get(monthKey) ?? [];
    list.push(event);
    cache.set(monthKey, list);
  }

  return cache;
}

function computePayrollFromEvents(
  enrichedEvents: EnrichedEvent[],
  coachUserId: string,
  signupMap: Map<string, string>,
  teamMetaBySessionId?: Map<
    string,
    { trainingTeamKey: string; teamName: string | null }
  >,
  now: Date = new Date(),
): CoachMonthPayrollBreakdown {
  if (enrichedEvents.length === 0) return EMPTY_BREAKDOWN;

  const sessions: CoachTrainingPayItem[] = enrichedEvents.map((event) => {
    const cancelled = event.occurrenceCancelled;
    const coachStatus = cancelled
      ? ("CANCELLED" as const)
      : normalizeSignupStatus(signupMap.get(event.id));
    const hasOccurred = event.startDate.getTime() <= now.getTime();
    const countsTowardPay = !cancelled && coachStatus !== "NOT_ATTENDING";
    const payable = countsTowardPay && hasOccurred;
    const expected = countsTowardPay && !hasOccurred;
    const meta = event.trainingSessionId
      ? teamMetaBySessionId?.get(event.trainingSessionId)
      : undefined;

    return {
      eventId: event.id,
      startDate: event.startDate.toISOString(),
      location: event.location,
      cancelled,
      coachStatus,
      payable,
      expected,
      amount: payable || expected ? COACH_SESSION_RATE_EUR : 0,
      trainingTeamKey: meta?.trainingTeamKey ?? null,
      teamName: meta?.teamName ?? null,
    };
  });

  const billableCount = sessions.filter((item) => item.payable).length;
  const expectedCount = sessions.filter((item) => item.expected).length;
  const cantAttendCount = sessions.filter(
    (item) => !item.cancelled && item.coachStatus === "NOT_ATTENDING",
  ).length;
  const cancelledCount = sessions.filter((item) => item.cancelled).length;

  return {
    sessions,
    billableCount,
    expectedCount,
    cantAttendCount,
    cancelledCount,
    totalScheduled: sessions.length,
  };
}

export async function getCoachMonthPayrollFromCache(
  coachUserId: string,
  trainingTeamKeys: string | string[],
  year: number,
  month: number,
  eventCache: EventCache,
): Promise<CoachMonthPayrollBreakdown> {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  const events = keys
    .flatMap((key) => eventCache.get(`${key}:${year}-${month}`) ?? [])
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  if (events.length === 0) return EMPTY_BREAKDOWN;

  const eventIds = events.map((e) => e.id);
  const signups = await prisma.eventSignup.findMany({
    where: { userId: coachUserId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });
  const signupMap = new Map(signups.map((s) => [s.eventId, s.status]));

  return computePayrollFromEvents(events, coachUserId, signupMap);
}

export async function getCoachMonthPayroll(
  coachUserId: string,
  trainingTeamKeys: string | string[],
  year: number,
  month: number,
): Promise<CoachMonthPayrollBreakdown> {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  if (keys.length === 0) return EMPTY_BREAKDOWN;

  const sessions = await prisma.trainingSession.findMany({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey: { in: keys },
    },
    select: { id: true, trainingTeamKey: true },
  });

  if (sessions.length === 0) return EMPTY_BREAKDOWN;

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: { in: sessions.map((session) => session.id) },
      startDate: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { startDate: "asc" },
  });

  if (events.length === 0) return EMPTY_BREAKDOWN;

  const squads = await prisma.trainingSquad.findMany({
    where: { key: { in: keys } },
    select: { key: true, name: true },
  });
  const squadNameByKey = new Map(squads.map((squad) => [squad.key, squad.name]));
  const teamMetaBySessionId = new Map(
    sessions
      .filter((session) => session.trainingTeamKey)
      .map((session) => [
        session.id,
        {
          trainingTeamKey: session.trainingTeamKey!,
          teamName: squadNameByKey.get(session.trainingTeamKey!) ?? null,
        },
      ]),
  );

  const enriched = await enrichEventRecords(events);
  const eventIds = enriched.map((event) => event.id);

  const signups = await prisma.eventSignup.findMany({
    where: { userId: coachUserId, eventId: { in: eventIds } },
    select: { eventId: true, status: true },
  });
  const signupMap = new Map(signups.map((signup) => [signup.eventId, signup.status]));

  return computePayrollFromEvents(
    enriched,
    coachUserId,
    signupMap,
    teamMetaBySessionId,
  );
}

export async function countSquadTrainingSessionsInMonth(
  trainingTeamKeys: string | string[],
  year: number,
  month: number,
) {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  if (keys.length === 0) return 0;

  const sessions = await prisma.trainingSession.findMany({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey: { in: keys },
    },
    select: { id: true },
  });

  if (sessions.length === 0) return 0;

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);

  const events = await prisma.event.findMany({
    where: {
      type: "TRAINING",
      trainingSessionId: { in: sessions.map((session) => session.id) },
      startDate: { gte: monthStart, lte: monthEnd },
    },
  });

  const enriched = await enrichEventRecords(events);
  return enriched.filter((event) => !event.occurrenceCancelled).length;
}

export async function ensureCoachSalaryPayment(
  clubMemberId: string,
  trainingTeamKeys: string | string[],
  year: number,
  month: number,
  coachUserId?: string | null,
) {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  const payroll = coachUserId
    ? await getCoachMonthPayroll(coachUserId, keys, year, month)
    : null;

  return ensureCoachSalaryPaymentFromBreakdown(
    clubMemberId,
    keys,
    year,
    month,
    payroll,
  );
}

async function ensureCoachSalaryPaymentFromBreakdown(
  clubMemberId: string,
  trainingTeamKeys: string | string[],
  year: number,
  month: number,
  payroll: CoachMonthPayrollBreakdown | null,
) {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  const ratePerSession = COACH_SESSION_RATE_EUR;
  const sessionCount = payroll
    ? coachPaymentBillableSessionCount(payroll, year, month)
    : await countSquadTrainingSessionsInMonth(keys, year, month);
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
  trainingTeamKeys: string | string[],
  coachUserId?: string | null,
  options: { monthsBack?: number; monthsAhead?: number } = {},
) {
  const keys = normalizeTeamKeys(trainingTeamKeys);
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
        ? await getCoachMonthPayroll(coachUserId, keys, year, month)
        : EMPTY_BREAKDOWN;

      const payment = await ensureCoachSalaryPaymentFromBreakdown(
        clubMemberId,
        keys,
        year,
        month,
        breakdown,
      );

      return serializePayment(payment, breakdown);
    }),
  );

  return payments;
}

export async function getCoachSalaryPaymentsWithCache(
  clubMemberId: string,
  trainingTeamKeys: string | string[],
  coachUserId?: string | null,
  options: { monthsBack?: number; monthsAhead?: number } = {},
  eventCache?: EventCache,
) {
  const keys = normalizeTeamKeys(trainingTeamKeys);
  if (!eventCache || !coachUserId) {
    return getCoachSalaryPayments(clubMemberId, keys, coachUserId, options);
  }

  const monthsBack = options.monthsBack ?? 12;
  const monthsAhead = options.monthsAhead ?? 3;
  const now = new Date();
  const periods: { year: number; month: number }[] = [];

  for (let offset = monthsAhead; offset >= -monthsBack; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    periods.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  const existingPayments = await prisma.coachSalaryPayment.findMany({
    where: { clubMemberId },
  });
  const existingMap = new Map(
    existingPayments.map((p) => [`${p.year}-${p.month}`, p]),
  );

  const squads = await prisma.trainingSquad.findMany({
    where: { key: { in: keys } },
    select: { key: true, name: true },
  });
  const squadNameByKey = new Map(squads.map((squad) => [squad.key, squad.name]));

  const allEventIds: string[] = [];
  const teamMetaBySessionId = new Map<
    string,
    { trainingTeamKey: string; teamName: string | null }
  >();

  for (const [cacheKey, events] of eventCache) {
    const teamKey = keys.find((key) => cacheKey.startsWith(`${key}:`));
    if (!teamKey) continue;
    for (const event of events) {
      allEventIds.push(event.id);
      if (event.trainingSessionId && !teamMetaBySessionId.has(event.trainingSessionId)) {
        teamMetaBySessionId.set(event.trainingSessionId, {
          trainingTeamKey: teamKey,
          teamName: squadNameByKey.get(teamKey) ?? null,
        });
      }
    }
  }

  const allSignups =
    allEventIds.length > 0
      ? await prisma.eventSignup.findMany({
          where: { userId: coachUserId, eventId: { in: allEventIds } },
          select: { eventId: true, status: true },
        })
      : [];
  const globalSignupMap = new Map(allSignups.map((s) => [s.eventId, s.status]));

  const payments = await Promise.all(
    periods.map(async ({ year, month }) => {
      const events = keys
        .flatMap((key) => eventCache.get(`${key}:${year}-${month}`) ?? [])
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      const breakdown = computePayrollFromEvents(
        events,
        coachUserId,
        globalSignupMap,
        teamMetaBySessionId,
      );

      const ratePerSession = COACH_SESSION_RATE_EUR;
      const sessionCount = coachPaymentBillableSessionCount(
        breakdown,
        year,
        month,
      );
      const amount = calculateCoachSalaryAmount(sessionCount, ratePerSession);

      const existing = existingMap.get(`${year}-${month}`);

      let payment;
      if (existing) {
        if (
          existing.status === "PENDING" &&
          (existing.sessionCount !== sessionCount || existing.amount !== amount)
        ) {
          payment = await prisma.coachSalaryPayment.update({
            where: { id: existing.id },
            data: { sessionCount, amount, ratePerSession },
          });
        } else {
          payment = existing;
        }
      } else {
        payment = await prisma.coachSalaryPayment.create({
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

      return serializePayment(payment, breakdown);
    }),
  );

  return payments;
}

export async function getCoachSalaryPaymentById(
  paymentId: string,
  coachUserId?: string | null,
  trainingTeamKeys?: string | string[] | null,
) {
  const payment = await prisma.coachSalaryPayment.findUnique({
    where: { id: paymentId },
    include: {
      clubMember: {
        select: {
          userId: true,
          trainingTeamKey: true,
          coachSquads: { select: { trainingTeamKey: true } },
        },
      },
    },
  });

  if (!payment) return null;

  const userId = coachUserId ?? payment.clubMember.userId;
  const keys = normalizeTeamKeys(
    trainingTeamKeys ??
      [
        ...(payment.clubMember.coachSquads?.map((row) => row.trainingTeamKey) ??
          []),
        payment.clubMember.trainingTeamKey ?? undefined,
      ].filter((key): key is string => Boolean(key)),
  );

  const breakdown =
    userId && keys.length > 0
      ? await getCoachMonthPayroll(userId, keys, payment.year, payment.month)
      : EMPTY_BREAKDOWN;

  return serializePayment(payment, breakdown);
}
