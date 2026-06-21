import { prisma } from "@/lib/prisma";
import {
  isOccurrenceCustomized,
  occurrenceDateKey,
} from "@/lib/training-occurrence";

export async function getAdminEventsPayload() {
  const [events, overrides, sessions] = await Promise.all([
    prisma.event.findMany({ orderBy: { startDate: "asc" } }),
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

  return events.map((event) => {
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
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() ?? null,
      trainingOccurrenceDate: event.trainingOccurrenceDate?.toISOString() ?? null,
      occurrenceCustomized: override ? isOccurrenceCustomized(override) : false,
      coach: override?.coach ?? session?.coach ?? null,
      attendanceUrl: override?.attendanceUrl ?? session?.attendanceUrl ?? null,
      sessionDescription:
        override?.description ?? session?.description ?? null,
    };
  });
}
