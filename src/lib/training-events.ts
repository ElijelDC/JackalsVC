import { startOfDay, endOfDay, addWeeks } from "date-fns";
import { prisma } from "@/lib/prisma";
import type { TrainingOccurrenceException } from "@/generated/prisma/client";
import type { TrainingSession } from "@/generated/prisma/client";
import {
  getOccurrenceOverridesMap,
  occurrenceDateKey,
  resolveOccurrenceAttendanceUrl,
  resolveOccurrencePaymentUrl,
  startOfOccurrenceDay,
} from "@/lib/training-occurrence";
import { applyClubWallTimeToDate } from "@/lib/datetime-form";
import {
  buildTrainingEventDescription,
  calendarEventTypeForCategory,
} from "@/lib/training-utils";

export {
  toTrainingSessionData,
  formatRecurrenceLabel,
  defaultRecurringFrom,
  defaultRecurringTo,
  buildTrainingEventDescription,
} from "@/lib/training-utils";

export const TRAINING_CALENDAR_WEEKS = 12;
const MAX_OCCURRENCES = 104;

function firstOccurrenceOnOrAfter(from: Date, dayOfWeek: number) {
  const date = startOfDay(from);
  const daysUntil = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

function buildSessionDescription(session: TrainingSession) {
  return buildTrainingEventDescription(session, session.category);
}

type EventOccurrence = {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: string;
  location: string;
  trainingSessionId: string;
  trainingOccurrenceDate: Date;
};

function buildEventPayload(
  session: TrainingSession,
  occurrenceDate: Date,
  startDate: Date,
  endDate: Date,
): EventOccurrence {
  return {
    title: session.title,
    description: buildSessionDescription(session),
    startDate,
    endDate,
    type: calendarEventTypeForCategory(session.category),
    location: session.location,
    trainingSessionId: session.id,
    trainingOccurrenceDate: startOfOccurrenceDay(occurrenceDate),
  };
}

function applyOverride(
  session: TrainingSession,
  occurrenceDate: Date,
  defaultStart: Date,
  defaultEnd: Date,
  override: TrainingOccurrenceException,
): EventOccurrence {
  if (override.cancelled) {
    return buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd);
  }

  return {
    title: override.title ?? session.title,
    description:
      override.coach != null || override.description != null
        ? buildTrainingEventDescription(session, session.category, {
            ...(override.coach != null ? { coach: override.coach } : {}),
            ...(override.description != null
              ? { description: override.description }
              : {}),
          })
        : buildSessionDescription(session),
    startDate: override.startDate ?? defaultStart,
    endDate: override.endDate ?? defaultEnd,
    type: calendarEventTypeForCategory(session.category),
    location: override.location ?? session.location,
    trainingSessionId: session.id,
    trainingOccurrenceDate: startOfOccurrenceDay(occurrenceDate),
  };
}

export function buildTrainingOccurrences(
  session: TrainingSession,
  overrides = new Map<string, TrainingOccurrenceException>(),
) {
  if (!session.recurring) {
    if (!session.sessionDate) return [];

    const day = new Date(session.sessionDate);
    const occurrenceDate = startOfOccurrenceDay(day);
    const defaultStart = applyClubWallTimeToDate(day, session.startTime);
    const defaultEnd = applyClubWallTimeToDate(day, session.endTime);
    const override = overrides.get(occurrenceDateKey(occurrenceDate));

    if (override) {
      return [
        applyOverride(
          session,
          occurrenceDate,
          defaultStart,
          defaultEnd,
          override,
        ),
      ];
    }

    return [buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd)];
  }

  const interval = session.recurrenceWeeks || 1;
  const rangeStart = startOfDay(session.recurringFrom ?? new Date());
  const rangeEnd = endOfDay(
    session.recurringTo ?? addWeeks(rangeStart, TRAINING_CALENDAR_WEEKS),
  );

  const occurrences: EventOccurrence[] = [];
  let current = firstOccurrenceOnOrAfter(rangeStart, session.dayOfWeek);

  while (current <= rangeEnd && occurrences.length < MAX_OCCURRENCES) {
    const occurrenceDate = startOfOccurrenceDay(current);
    const defaultStart = applyClubWallTimeToDate(current, session.startTime);
    const defaultEnd = applyClubWallTimeToDate(current, session.endTime);
    const override = overrides.get(occurrenceDateKey(occurrenceDate));

    if (override) {
      occurrences.push(
        applyOverride(
          session,
          occurrenceDate,
          defaultStart,
          defaultEnd,
          override,
        ),
      );
    } else {
      occurrences.push(
        buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd),
      );
    }

    current = addWeeks(current, interval);
  }

  return occurrences;
}

export async function getNextUpcomingOccurrence(session: TrainingSession) {
  const overrides = await getOccurrenceOverridesMap(session.id);
  const occurrences = buildTrainingOccurrences(session, overrides);
  const now = new Date();

  return (
    occurrences
      .filter((occurrence) => {
        const override = overrides.get(
          occurrenceDateKey(occurrence.trainingOccurrenceDate),
        );
        if (override?.cancelled) return false;
        return occurrence.endDate >= now;
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] ?? null
  );
}

export async function resolveUpcomingAttendanceUrl(session: TrainingSession) {
  const nextOccurrence = await getNextUpcomingOccurrence(session);

  if (nextOccurrence) {
    const url = await resolveOccurrenceAttendanceUrl(
      session.id,
      nextOccurrence.trainingOccurrenceDate,
      session.attendanceUrl,
    );

    return {
      url,
      occurrenceDate: nextOccurrence.trainingOccurrenceDate,
    };
  }

  return {
    url: session.attendanceUrl,
    occurrenceDate: null,
  };
}

export async function resolveUpcomingPaymentUrl(session: TrainingSession) {
  const nextOccurrence = await getNextUpcomingOccurrence(session);

  if (nextOccurrence) {
    const url = await resolveOccurrencePaymentUrl(
      session.id,
      nextOccurrence.trainingOccurrenceDate,
      session.paymentUrl,
    );

    return {
      url,
      occurrenceDate: nextOccurrence.trainingOccurrenceDate,
    };
  }

  return {
    url: session.paymentUrl,
    occurrenceDate: null,
  };
}

export async function syncTrainingSessionEvents(session: TrainingSession) {
  const overrides = await getOccurrenceOverridesMap(session.id);

  await prisma.event.deleteMany({
    where: { trainingSessionId: session.id },
  });

  const occurrences = buildTrainingOccurrences(session, overrides);
  if (occurrences.length > 0) {
    await prisma.event.createMany({ data: occurrences });
  }
}

export async function syncAllTrainingSessionEvents() {
  const sessions = await prisma.trainingSession.findMany();
  for (const session of sessions) {
    await syncTrainingSessionEvents(session);
  }
}

export async function deleteTrainingSessionEvents(sessionId: string) {
  await prisma.event.deleteMany({ where: { trainingSessionId: sessionId } });
}

export async function deleteTrainingSessionCascade(sessionId: string) {
  await prisma.$transaction(async (tx) => {
    const events = await tx.event.findMany({
      where: { trainingSessionId: sessionId },
      select: { id: true },
    });
    const eventIds = events.map((event) => event.id);

    if (eventIds.length > 0) {
      await tx.eventReminder.deleteMany({
        where: { eventId: { in: eventIds } },
      });
      await tx.event.deleteMany({
        where: { id: { in: eventIds } },
      });
    }

    await tx.trainingOccurrenceException.deleteMany({
      where: { trainingSessionId: sessionId },
    });

    await tx.trainingSession.delete({ where: { id: sessionId } });
  });
}
