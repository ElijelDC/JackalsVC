import { prisma } from "@/lib/prisma";

export function startOfOccurrenceDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function occurrenceDateKey(date: Date) {
  return startOfOccurrenceDay(date).toISOString();
}

export function resolveOccurrenceDate(event: {
  trainingOccurrenceDate: Date | null;
  startDate: Date;
}) {
  return startOfOccurrenceDay(
    event.trainingOccurrenceDate ?? event.startDate,
  );
}

type OccurrenceOverrideInput = {
  cancelled?: boolean;
  title?: string | null;
  description?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  location?: string | null;
  coach?: string | null;
  attendanceUrl?: string | null;
};

export async function upsertOccurrenceOverride(
  trainingSessionId: string,
  occurrenceDate: Date,
  data: OccurrenceOverrideInput,
) {
  const day = startOfOccurrenceDay(occurrenceDate);

  return prisma.trainingOccurrenceException.upsert({
    where: {
      trainingSessionId_occurrenceDate: {
        trainingSessionId,
        occurrenceDate: day,
      },
    },
    create: {
      trainingSessionId,
      occurrenceDate: day,
      cancelled: data.cancelled ?? false,
      title: data.title ?? null,
      description: data.description ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      location: data.location ?? null,
      coach: data.coach ?? null,
      attendanceUrl: data.attendanceUrl ?? null,
    },
    update: {
      cancelled: data.cancelled ?? false,
      title: data.title ?? null,
      description: data.description ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      location: data.location ?? null,
      coach: data.coach ?? null,
      attendanceUrl: data.attendanceUrl ?? null,
    },
  });
}

export async function cancelTrainingOccurrence(
  trainingSessionId: string,
  occurrenceDate: Date,
) {
  return upsertOccurrenceOverride(trainingSessionId, occurrenceDate, {
    cancelled: true,
    title: null,
    description: null,
    startDate: null,
    endDate: null,
    location: null,
    coach: null,
    attendanceUrl: null,
  });
}

export async function getOccurrenceOverridesMap(sessionId: string) {
  const overrides = await prisma.trainingOccurrenceException.findMany({
    where: { trainingSessionId: sessionId },
  });

  return new Map(
    overrides.map((override) => [
      occurrenceDateKey(override.occurrenceDate),
      override,
    ]),
  );
}

export async function resolveOccurrenceAttendanceUrl(
  trainingSessionId: string,
  occurrenceDate: Date,
  sessionAttendanceUrl: string | null,
) {
  const override = await prisma.trainingOccurrenceException.findUnique({
    where: {
      trainingSessionId_occurrenceDate: {
        trainingSessionId,
        occurrenceDate: startOfOccurrenceDay(occurrenceDate),
      },
    },
    select: { attendanceUrl: true },
  });

  if (override?.attendanceUrl) return override.attendanceUrl;
  return sessionAttendanceUrl;
}

export function isOccurrenceCustomized(override: {
  cancelled: boolean;
  title: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  coach: string | null;
  attendanceUrl: string | null;
}) {
  return (
    !override.cancelled &&
    Boolean(
      override.title ||
        override.description ||
        override.startDate ||
        override.endDate ||
        override.location ||
        override.coach ||
        override.attendanceUrl,
    )
  );
}
