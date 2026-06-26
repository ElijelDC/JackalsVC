import { addWeeks, startOfDay } from "date-fns";
import { notFound } from "next/navigation";
import { FUN_SESSION_CALENDAR_WEEKS } from "@/lib/event-filters";
import { getNextUpcomingOccurrence } from "@/lib/training-events";
import { prisma } from "@/lib/prisma";
import type { TrainingSession } from "@/generated/prisma/client";
import type { SessionCategory } from "@/lib/training-utils";
import { SESSION_CATEGORIES } from "@/lib/training-utils";

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
      select: { id: true, trainingSessionId: true, startDate: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const sessionsWithUpcoming = new Set(
    upcomingEvents.map((event) => event.trainingSessionId!),
  );

  // Build map of session → next upcoming event ID + date
  const nextEventBySession = new Map<string, { id: string; startDate: Date }>();
  for (const event of upcomingEvents) {
    if (event.trainingSessionId && event.startDate >= now && !nextEventBySession.has(event.trainingSessionId)) {
      nextEventBySession.set(event.trainingSessionId, { id: event.id, startDate: event.startDate });
    }
  }

  return sessions
    .filter((session) => {
      if (sessionsWithUpcoming.has(session.id)) return true;

      if (session.recurring) return false;

      if (!session.sessionDate) return false;

      const sessionDay = startOfDay(new Date(session.sessionDate));
      const today = startOfDay(now);
      const horizon = startOfDay(through);

      return sessionDay >= today && sessionDay <= horizon;
    })
    .map((session) => {
      const next = nextEventBySession.get(session.id);
      return {
        ...session,
        nextEventId: next?.id ?? null,
        nextEventDate: next?.startDate ?? null,
      };
    });
}

export function assertSessionCalendarAccess(
  category: SessionCategory,
  isLoggedIn: boolean,
) {
  if (category === SESSION_CATEGORIES.WEEKLY && !isLoggedIn) {
    notFound();
  }
}
