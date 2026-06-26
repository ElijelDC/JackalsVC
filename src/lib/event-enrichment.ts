import type { Event, TrainingOccurrenceException, TrainingSession } from "@/generated/prisma/client";
import {
  isOccurrenceCustomized,
  occurrenceDateKey,
} from "@/lib/training-occurrence";
import { prisma } from "@/lib/prisma";

export type EnrichedEvent = Event & {
  trainingOccurrenceDate: Date | null;
  occurrenceCustomized: boolean;
  occurrenceCancelled: boolean;
  hasOccurrenceOverride: boolean;
  coach: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  seriesAttendanceUrl: string | null;
  seriesPaymentUrl: string | null;
  reclubUsername: string | null;
  sessionFee: number | null;
  sessionDescription: string | null;
  sessionCategory: string | null;
  trainingTeamKey: string | null;
  clubIban: string | null;
};

function enrichSingleEvent(
  event: Event,
  overrideMap: Map<string, TrainingOccurrenceException>,
  sessionMap: Map<string, TrainingSession>,
): EnrichedEvent {
  const occurrenceKey =
    event.trainingSessionId && event.trainingOccurrenceDate
      ? `${event.trainingSessionId}:${occurrenceDateKey(event.trainingOccurrenceDate)}`
      : event.trainingSessionId
        ? `${event.trainingSessionId}:${occurrenceDateKey(event.startDate)}`
        : null;

  const override = occurrenceKey ? overrideMap.get(occurrenceKey) : undefined;
  const session = event.trainingSessionId
    ? sessionMap.get(event.trainingSessionId)
    : undefined;

  return {
    ...event,
    occurrenceCustomized: override ? isOccurrenceCustomized(override) : false,
    occurrenceCancelled: override?.cancelled ?? false,
    hasOccurrenceOverride: Boolean(override),
    coach: override?.coach ?? session?.coach ?? null,
    attendanceUrl: override?.attendanceUrl
      ?? session?.attendanceUrl ?? event.attendanceUrl ?? null,
    paymentUrl: override?.paymentUrl
      ?? session?.paymentUrl ?? event.paymentUrl ?? null,
    seriesAttendanceUrl: session?.attendanceUrl ?? null,
    seriesPaymentUrl: session?.paymentUrl ?? null,
    reclubUsername: session?.reclubUsername ?? event.reclubUsername ?? null,
    sessionFee: session?.sessionFee ?? event.sessionFee ?? null,
    clubIban: event.clubIban ?? null,
    sessionDescription:
      override?.description ?? session?.description ?? null,
    sessionCategory: session?.category ?? null,
    trainingTeamKey: session?.trainingTeamKey ?? null,
  };
}

export async function enrichEventRecords(events: Event[]) {
  if (events.length === 0) return [] as EnrichedEvent[];

  const sessionIds = [
    ...new Set(
      events
        .map((e) => e.trainingSessionId)
        .filter((id): id is string => id != null),
    ),
  ];

  const [overrides, sessions] = await Promise.all([
    sessionIds.length > 0
      ? prisma.trainingOccurrenceException.findMany({
          where: { trainingSessionId: { in: sessionIds } },
        })
      : Promise.resolve([]),
    sessionIds.length > 0
      ? prisma.trainingSession.findMany({
          where: { id: { in: sessionIds } },
        })
      : Promise.resolve([]),
  ]);

  const overrideMap = new Map(
    overrides.map((override) => [
      `${override.trainingSessionId}:${occurrenceDateKey(override.occurrenceDate)}`,
      override,
    ]),
  );

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));

  return events.map((event) =>
    enrichSingleEvent(event, overrideMap, sessionMap),
  );
}

export function serializeEnrichedEvent(event: EnrichedEvent) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    type: event.type,
    location: event.location,
    trainingSessionId: event.trainingSessionId,
    trainingOccurrenceDate: event.trainingOccurrenceDate?.toISOString() ?? null,
    occurrenceCustomized: event.occurrenceCustomized,
    occurrenceCancelled: event.occurrenceCancelled,
    hasOccurrenceOverride: event.hasOccurrenceOverride,
    coach: event.coach,
    attendanceUrl: event.attendanceUrl,
    paymentUrl: event.paymentUrl,
    seriesAttendanceUrl: event.seriesAttendanceUrl,
    seriesPaymentUrl: event.seriesPaymentUrl,
    reclubUsername: event.reclubUsername,
    sessionFee: event.sessionFee,
    clubIban: event.clubIban,
    sessionDescription: event.sessionDescription,
    sessionCategory: event.sessionCategory,
    trainingTeamKey: event.trainingTeamKey,
  };
}
