import "server-only";

import { startOfDay } from "date-fns";
import type { EventsCalendarEvent } from "@/lib/events-config";
import { inferReclubEventType } from "@/lib/reclub-event-type";
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
      type: { in: ["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL", "FUN"] },
      OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
    },
    orderBy: { startDate: "asc" },
  });
}

type CalendarEventRow = Awaited<ReturnType<typeof getEventsCalendarRows>>[number];

function resolveBrowseEventType(event: CalendarEventRow): string {
  if (event.reclubReferenceCode) {
    return inferReclubEventType({
      title: event.title,
      description: event.description,
    });
  }

  return event.type;
}

export async function getEventsPageData() {
  const [funSessions, calendarEvents] = await Promise.all([
    getVisibleFunSessions(),
    getEventsCalendarRows(),
  ]);

  const skillsClinics = calendarEvents.filter(
    (event) => resolveBrowseEventType(event) === "SKILLS_CLINIC",
  );
  const socials = calendarEvents.filter(
    (event) => resolveBrowseEventType(event) === "SOCIAL",
  );
  const reclubFunEvents = calendarEvents.filter(
    (event) => resolveBrowseEventType(event) === "FUN",
  );

  return {
    funSessions,
    reclubFunEvents,
    tournaments: calendarEvents.filter(
      (event) => resolveBrowseEventType(event) === "TOURNAMENT",
    ),
    skillsClinics,
    socials,
  };
}
