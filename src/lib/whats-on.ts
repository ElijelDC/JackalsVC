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

export const WHATS_ON_SECTIONS = {
  funSessions: "fun-sessions",
  tournaments: "tournaments",
  skillsClinics: "skills-clinics",
} as const;

export type WhatsOnSectionKey = keyof typeof WHATS_ON_SECTIONS;

export function whatsOnSectionPath(section: WhatsOnSectionKey) {
  return `/whats-on#${WHATS_ON_SECTIONS[section]}`;
}

export function whatsOnEventDetailPath(
  eventId: string,
  section: "tournaments" | "skillsClinics",
) {
  return `/calendar/${eventId}?from=whats-on-${WHATS_ON_SECTIONS[section]}`;
}

export function resolveWhatsOnBackLink(from: string | undefined) {
  if (from === `whats-on-${WHATS_ON_SECTIONS.tournaments}`) {
    return { path: whatsOnSectionPath("tournaments"), label: "What's On?" };
  }
  if (from === `whats-on-${WHATS_ON_SECTIONS.skillsClinics}`) {
    return { path: whatsOnSectionPath("skillsClinics"), label: "What's On?" };
  }
  if (from === "whats-on" || from?.startsWith("whats-on-")) {
    return { path: "/whats-on", label: "What's On?" };
  }
  return null;
}
