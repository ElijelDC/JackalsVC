import { addWeeks, startOfDay } from "date-fns";
import { notFound } from "next/navigation";
import { FUN_SESSION_CALENDAR_WEEKS } from "@/lib/event-filters";
import { getNextUpcomingOccurrence, resolveUpcomingAttendanceUrl, resolveUpcomingPaymentUrl } from "@/lib/training-events";
import { startOfOccurrenceDay } from "@/lib/training-occurrence";
import { prisma } from "@/lib/prisma";
import type { TrainingSession } from "@/generated/prisma/client";
import type { SessionCategory } from "@/lib/training-utils";
import { SESSION_CATEGORIES } from "@/lib/training-utils";
import { getPublicSession } from "@/lib/session-detail";

export type SessionCalendarExport = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string;
  occurrenceDate: string;
};

export async function getSessionCalendarExport(session: TrainingSession) {
  const nextOccurrence = await getNextUpcomingOccurrence(session);
  if (!nextOccurrence) return null;

  return {
    id: session.id,
    title: nextOccurrence.title,
    description: nextOccurrence.description,
    startDate: nextOccurrence.startDate.toISOString(),
    endDate: nextOccurrence.endDate.toISOString(),
    location: nextOccurrence.location,
    occurrenceDate: nextOccurrence.trainingOccurrenceDate.toISOString(),
  } satisfies SessionCalendarExport;
}

export async function getLinkedCalendarEventId(
  sessionId: string,
  occurrenceDate: string,
) {
  const event = await prisma.event.findFirst({
    where: {
      trainingSessionId: sessionId,
      trainingOccurrenceDate: startOfOccurrenceDay(new Date(occurrenceDate)),
    },
    select: { id: true },
  });

  return event?.id ?? null;
}

export type ScheduleOccurrence = {
  calendarEventId: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
};

export async function getUpcomingScheduleItems(
  sessionId: string,
  weeksAhead?: number,
) {
  const now = new Date();
  const through =
    weeksAhead != null ? addWeeks(now, weeksAhead) : undefined;
  const events = await prisma.event.findMany({
    where: {
      trainingSessionId: sessionId,
      ...(through ? { startDate: { lte: through } } : {}),
      OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      location: true,
    },
  });

  return events.map((event) => ({
    calendarEventId: event.id,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? event.startDate.toISOString(),
    location: event.location,
  })) satisfies ScheduleOccurrence[];
}

export async function getVisibleFunSessions(
  weeksAhead = FUN_SESSION_CALENDAR_WEEKS,
) {
  const now = new Date();
  const through = addWeeks(now, weeksAhead);

  const [sessions, upcomingEvents] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { category: SESSION_CATEGORIES.FUN },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.event.findMany({
      where: {
        type: "FUN",
        trainingSessionId: { not: null },
        startDate: { lte: through },
        OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
      },
      select: { trainingSessionId: true },
    }),
  ]);

  const sessionsWithUpcoming = new Set(
    upcomingEvents.map((event) => event.trainingSessionId!),
  );

  return sessions.filter((session) => {
    if (sessionsWithUpcoming.has(session.id)) return true;

    if (session.recurring) return false;

    if (!session.sessionDate) return false;

    const sessionDay = startOfDay(new Date(session.sessionDate));
    const today = startOfDay(now);
    const horizon = startOfDay(through);

    return sessionDay >= today && sessionDay <= horizon;
  });
}

export async function getSessionDetailPageContext(
  id: string,
  category: SessionCategory,
) {
  const session = await getPublicSession(id, category);
  const scheduleWeeksAhead =
    category === SESSION_CATEGORIES.FUN ? FUN_SESSION_CALENDAR_WEEKS : undefined;

  const [attendance, payment, calendarExport, upcomingSchedule] = await Promise.all([
    resolveUpcomingAttendanceUrl(session),
    resolveUpcomingPaymentUrl(session),
    getSessionCalendarExport(session),
    getUpcomingScheduleItems(session.id, scheduleWeeksAhead),
  ]);

  let linkedCalendarEventId: string | null = null;

  if (calendarExport) {
    linkedCalendarEventId = await getLinkedCalendarEventId(
      session.id,
      calendarExport.occurrenceDate,
    );
  }

  return {
    session,
    attendanceUrl: attendance.url,
    attendanceOccurrenceDate: attendance.occurrenceDate?.toISOString() ?? null,
    paymentUrl: payment.url,
    reclubUsername: session.reclubUsername,
    calendarExport,
    linkedCalendarEventId,
    upcomingSchedule,
  };
}

export function sessionCalendarIcsPath(
  sessionId: string,
  category: SessionCategory,
) {
  return `/api/sessions/${sessionId}/calendar?category=${category}`;
}

export function assertSessionCalendarAccess(
  category: SessionCategory,
  isLoggedIn: boolean,
) {
  if (category === SESSION_CATEGORIES.WEEKLY && !isLoggedIn) {
    notFound();
  }
}
