import { prisma } from "@/lib/prisma";
import { syncTrainingSessionEvents } from "@/lib/training-events";
import { syncTrainingSquadDayFromSession } from "@/lib/training-squads";
import {
  applyTimeToOccurrenceDay,
  cancelTrainingOccurrence,
  resetTrainingOccurrence,
  resolveOccurrenceDate,
  upsertOccurrenceOverride,
} from "@/lib/training-occurrence";
import {
  SESSION_CATEGORIES,
  serializeTrainingSession,
} from "@/lib/training-utils";
import type { coachTrainingOccurrenceSchema, coachTrainingUpdateSchema } from "@/lib/validations";
import type { z } from "zod";

type WeeklyScheduleUpdate = z.infer<typeof coachTrainingUpdateSchema>;
type OccurrenceUpdate = z.infer<typeof coachTrainingOccurrenceSchema>;

export async function getWeeklyTrainingSessionForTeam(trainingTeamKey: string) {
  return prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey,
    },
  });
}

export async function createWeeklyTrainingSession(
  trainingTeamKey: string,
  data: WeeklyScheduleUpdate,
) {
  const squad = await prisma.trainingSquad.findUnique({
    where: { key: trainingTeamKey },
  });

  if (!squad) {
    return { ok: false as const, error: "Squad not found" };
  }

  const session = await prisma.trainingSession.create({
    data: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey,
      title: squad.name,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      level: "",
      recurring: true,
      recurrenceWeeks: 1,
      recurringFrom: data.recurringFrom ? new Date(data.recurringFrom) : undefined,
      recurringTo: data.recurringTo ? new Date(data.recurringTo) : undefined,
    },
  });

  await syncTrainingSquadDayFromSession(session);
  await syncTrainingSessionEvents(session);

  return { ok: true as const, session: serializeTrainingSession(session) };
}

export async function updateWeeklyTrainingSchedule(
  trainingTeamKey: string,
  data: WeeklyScheduleUpdate,
) {
  const existing = await getWeeklyTrainingSessionForTeam(trainingTeamKey);
  if (!existing) {
    return { ok: false as const, error: "No training session found for this squad" };
  }

  const session = await prisma.trainingSession.update({
    where: { id: existing.id },
    data: {
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      recurringFrom: data.recurringFrom ? new Date(data.recurringFrom) : undefined,
      recurringTo: data.recurringTo ? new Date(data.recurringTo) : undefined,
    },
  });

  await syncTrainingSquadDayFromSession(session);
  await syncTrainingSessionEvents(session);

  return { ok: true as const, session: serializeTrainingSession(session) };
}

async function getTrainingEvent(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trainingSession: {
        select: { id: true, trainingTeamKey: true, title: true },
      },
    },
  });
}

export async function getTrainingEventForTeam(
  eventId: string,
  trainingTeamKey?: string,
) {
  const event = await getTrainingEvent(eventId);

  if (
    !event?.trainingSessionId ||
    !event.trainingSession ||
    event.type !== "TRAINING"
  ) {
    return null;
  }

  if (
    trainingTeamKey &&
    event.trainingSession.trainingTeamKey !== trainingTeamKey
  ) {
    return null;
  }

  return { event, session: event.trainingSession };
}

export async function patchTrainingOccurrence(
  eventId: string,
  data: OccurrenceUpdate,
  trainingTeamKey?: string,
) {
  const match = await getTrainingEventForTeam(eventId, trainingTeamKey);
  if (!match) {
    return { ok: false as const, error: "Training session not found" };
  }

  const occurrenceDate = resolveOccurrenceDate(match.event);
  const startDate = applyTimeToOccurrenceDay(occurrenceDate, data.startTime);
  const endDate = applyTimeToOccurrenceDay(occurrenceDate, data.endTime);

  if (endDate <= startDate) {
    return { ok: false as const, error: "End time must be after start time" };
  }

  await upsertOccurrenceOverride(match.session.id, occurrenceDate, {
    title: match.session.title,
    startDate,
    endDate,
    location: data.location,
  });

  const session = await prisma.trainingSession.findUnique({
    where: { id: match.session.id },
  });
  if (session) {
    await syncTrainingSessionEvents(session);
  }

  return { ok: true as const };
}

export async function deleteTrainingOccurrence(
  eventId: string,
  action: "reset" | "cancel",
  trainingTeamKey?: string,
) {
  const match = await getTrainingEventForTeam(eventId, trainingTeamKey);
  if (!match) {
    return { ok: false as const, error: "Training session not found" };
  }

  const occurrenceDate = resolveOccurrenceDate(match.event);

  if (action === "cancel") {
    await cancelTrainingOccurrence(match.session.id, occurrenceDate);
  } else {
    await resetTrainingOccurrence(match.session.id, occurrenceDate);
  }

  const session = await prisma.trainingSession.findUnique({
    where: { id: match.session.id },
  });
  if (session) {
    await syncTrainingSessionEvents(session);
  }

  return { ok: true as const };
}
