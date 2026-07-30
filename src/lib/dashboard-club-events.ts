import {
  enrichEventRecords,
  serializeEnrichedEvent,
} from "@/lib/event-enrichment";
import type { DashboardClubEvent } from "@/components/dashboard/dashboard-types";
import { prisma } from "@/lib/prisma";

const CLUB_EVENT_TYPES = ["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL"] as const;

export function toDashboardClubEvent(
  event: ReturnType<typeof serializeEnrichedEvent>,
): DashboardClubEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    type: event.type,
    location: event.location,
    coach: event.coach,
    trainingSessionId: event.trainingSessionId,
  };
}

export async function getDashboardClubEvents(
  now: Date,
  weeks: number,
): Promise<DashboardClubEvent[]> {
  const eventsThrough = new Date(now);
  eventsThrough.setDate(eventsThrough.getDate() + weeks * 7);

  const events = await prisma.event.findMany({
    where: {
      startDate: { gte: now, lte: eventsThrough },
      type: { in: [...CLUB_EVENT_TYPES] },
    },
    orderBy: { startDate: "asc" },
  });

  const enriched = await enrichEventRecords(events);
  return enriched.map(serializeEnrichedEvent).map(toDashboardClubEvent);
}
