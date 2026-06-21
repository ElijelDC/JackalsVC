import type { Event, TrainingOccurrenceException, TrainingSession } from "@/generated/prisma/client";
import {
  isOccurrenceCustomized,
  occurrenceDateKey,
} from "@/lib/training-occurrence";
import { prisma } from "@/lib/prisma";

export type EnrichedEvent = Event & {
  trainingOccurrenceDate: Date | null;
  occurrenceCustomized: boolean;
  hasOccurrenceOverride: boolean;
  coach: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  seriesAttendanceUrl: string | null;
  seriesPaymentUrl: string | null;
  reclubUsername: string | null;
  sessionDescription: string | null;
  sessionCategory: string | null;
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
    hasOccurrenceOverride: Boolean(override),
    coach: override?.coach ?? session?.coach ?? null,
    attendanceUrl: override
      ? override.attendanceUrl
      : (session?.attendanceUrl ?? event.attendanceUrl ?? null),
    paymentUrl: override
      ? override.paymentUrl
      : (session?.paymentUrl ?? null),
    seriesAttendanceUrl: session?.attendanceUrl ?? null,
    seriesPaymentUrl: session?.paymentUrl ?? null,
    reclubUsername: session?.reclubUsername ?? null,
    sessionDescription:
      override?.description ?? session?.description ?? null,
    sessionCategory: session?.category ?? null,
  };
}

export async function enrichEventRecords(events: Event[]) {
  if (events.length === 0) return [] as EnrichedEvent[];

  const [overrides, sessions] = await Promise.all([
    prisma.trainingOccurrenceException.findMany(),
    prisma.trainingSession.findMany(),
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
    hasOccurrenceOverride: event.hasOccurrenceOverride,
    coach: event.coach,
    attendanceUrl: event.attendanceUrl,
    paymentUrl: event.paymentUrl,
    seriesAttendanceUrl: event.seriesAttendanceUrl,
    seriesPaymentUrl: event.seriesPaymentUrl,
    reclubUsername: event.reclubUsername,
    sessionDescription: event.sessionDescription,
    sessionCategory: event.sessionCategory,
  };
}
