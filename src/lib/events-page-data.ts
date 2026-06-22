import "server-only";

import { startOfDay } from "date-fns";
import type { EventsCalendarEvent } from "@/lib/events-config";
import { getVisibleFunSessions } from "@/lib/session-calendar";
import { prisma } from "@/lib/prisma";

export type { EventsCalendarEvent } from "@/lib/events-config";
export {
  EVENTS_SECTIONS,
  eventsCalendarEventDetailPath,
  eventsEventDetailPath,
  eventsSectionPath,
  resolveEventsBackLink,
} from "@/lib/events-config";

export async function getEventsCalendarRows(): Promise<EventsCalendarEvent[]> {
  const now = startOfDay(new Date());

  return prisma.event.findMany({
    where: {
      trainingSessionId: null,
      type: { in: ["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL"] },
      OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getEventsPageData() {
  const [funSessions, calendarEvents] = await Promise.all([
    getVisibleFunSessions(),
    getEventsCalendarRows(),
  ]);

  const skillsClinics = calendarEvents.filter(
    (event) => event.type === "SKILLS_CLINIC",
  );
  const socials = calendarEvents.filter((event) => event.type === "SOCIAL");

  return {
    funSessions,
    tournaments: calendarEvents.filter((event) => event.type === "TOURNAMENT"),
    skillsClinics,
    socials,
  };
}
