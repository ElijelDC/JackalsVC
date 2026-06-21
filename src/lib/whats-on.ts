import { startOfDay } from "date-fns";
import { getVisibleFunSessions } from "@/lib/session-calendar";
import { prisma } from "@/lib/prisma";

export async function getWhatsOnCalendarEvents() {
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

  return {
    funSessions,
    tournaments: calendarEvents.filter((event) => event.type === "TOURNAMENT"),
    skillsClinics: calendarEvents.filter((event) => event.type === "SOCIAL"),
  };
}

export type WhatsOnCalendarEvent = Awaited<
  ReturnType<typeof getWhatsOnCalendarEvents>
>[number];
