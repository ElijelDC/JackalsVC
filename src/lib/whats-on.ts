import "server-only";

import { startOfDay } from "date-fns";
import type { EventsCalendarEvent } from "@/lib/events-config";
import { splitSocialCalendarEvents } from "@/lib/events-config";
import { getVisibleFunSessions } from "@/lib/session-calendar";
import { prisma } from "@/lib/prisma";

export type { EventsCalendarEvent, WhatsOnCalendarEvent } from "@/lib/events-config";
export {
  EVENTS_SECTIONS,
  WHATS_ON_SECTIONS,
  eventsCalendarEventDetailPath,
  eventsEventDetailPath,
  eventsSectionPath,
  resolveEventsBackLink,
  resolveWhatsOnBackLink,
  whatsOnEventDetailPath,
  whatsOnSectionPath,
} from "@/lib/events-config";

export async function getWhatsOnCalendarEvents(): Promise<EventsCalendarEvent[]> {
  const now = startOfDay(new Date());

  return prisma.event.findMany({
    where: {
      trainingSessionId: null,
      type: { in: ["TOURNAMENT", "SOCIAL"] },
      OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getWhatsOnPageData() {
  const [funSessions, calendarEvents] = await Promise.all([
    getVisibleFunSessions(),
    getWhatsOnCalendarEvents(),
  ]);

  const socialEvents = calendarEvents.filter((event) => event.type === "SOCIAL");
  const { skillsClinics, socials } = splitSocialCalendarEvents(socialEvents);

  return {
    funSessions,
    tournaments: calendarEvents.filter((event) => event.type === "TOURNAMENT"),
    skillsClinics,
    socials,
  };
}
