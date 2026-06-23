import "server-only";

import type { Event } from "@/generated/prisma/client";
import type { TrainingOccurrenceException } from "@/generated/prisma/client";
import {
  getOccurrenceOverridesMap,
  isOccurrenceCustomized,
  occurrenceDateKey,
  resolveOccurrenceDate,
} from "@/lib/training-occurrence";
import { getAllTeamTrainingEvents } from "@/lib/training-teams";

export type CoachTrainingSessionItem = {
  eventId: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  customized: boolean;
  cancelled: boolean;
};

export function mapTrainingEventsToCoachSessions(
  events: Event[],
  overrides: Map<string, TrainingOccurrenceException>,
): CoachTrainingSessionItem[] {
  return events.map((event) => {
    const occurrenceDate = resolveOccurrenceDate(event);
    const override = overrides.get(occurrenceDateKey(occurrenceDate));

    return {
      eventId: event.id,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate?.toISOString() ?? null,
      location: event.location,
      customized: override ? isOccurrenceCustomized(override) : false,
      cancelled: override?.cancelled ?? false,
    };
  });
}

export async function getCoachTrainingSessionsForTeam(
  trainingTeamKey: string,
  sessionId: string,
) {
  const [events, overrides] = await Promise.all([
    getAllTeamTrainingEvents(trainingTeamKey),
    getOccurrenceOverridesMap(sessionId),
  ]);

  return mapTrainingEventsToCoachSessions(events, overrides);
}
