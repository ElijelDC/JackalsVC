export const EVENTS_SECTIONS = {
  funSessions: "fun-sessions",
  tournaments: "tournaments",
  skillsClinics: "skills-clinics",
  socials: "socials",
} as const;

/** @deprecated Use EVENTS_SECTIONS */
export const WHATS_ON_SECTIONS = EVENTS_SECTIONS;

export type EventsSectionKey = keyof typeof EVENTS_SECTIONS;

/** @deprecated Use EventsSectionKey */
export type WhatsOnSectionKey = EventsSectionKey;

export type EventsCalendarEvent = {
  id: string;
  title: string;
  type: string;
  startDate: Date | string;
  endDate: Date | string | null;
  location: string | null;
  description: string | null;
  sessionFee: number | null;
};

/** @deprecated Use EventsCalendarEvent */
export type WhatsOnCalendarEvent = EventsCalendarEvent;

export function isSkillsClinicEvent(event: {
  title: string;
  description: string | null;
}) {
  return /clinic|workshop/i.test(`${event.title} ${event.description ?? ""}`);
}

export function splitSocialCalendarEvents(events: EventsCalendarEvent[]) {
  const skillsClinics = events.filter(isSkillsClinicEvent);
  const socials = events.filter((event) => !isSkillsClinicEvent(event));
  return { skillsClinics, socials };
}

export function getSocialCalendarEventLabel(event: {
  title: string;
  description?: string | null;
}) {
  return isSkillsClinicEvent({
    title: event.title,
    description: event.description ?? null,
  })
    ? "Skills clinic"
    : "Social activity";
}

export function getBrowseEventTypeLabel(event: {
  type: string;
  title: string;
  description?: string | null;
}) {
  if (event.type === "SOCIAL") {
    return getSocialCalendarEventLabel(event);
  }

  const labels: Record<string, string> = {
    TOURNAMENT: "Tournament",
    FUN: "Fun session",
    TRAINING: "Training",
    MEETING: "Meeting",
  };

  return labels[event.type] ?? event.type;
}

export function eventsSectionPath(section: EventsSectionKey) {
  return `/events#${EVENTS_SECTIONS[section]}`;
}

/** @deprecated Use eventsSectionPath */
export function whatsOnSectionPath(section: EventsSectionKey) {
  return eventsSectionPath(section);
}

export function eventsEventDetailPath(
  eventId: string,
  section: "tournaments" | "skillsClinics" | "socials",
) {
  return `/calendar/${eventId}?from=events-${EVENTS_SECTIONS[section]}`;
}

export function eventsCalendarEventDetailPath(eventId: string) {
  return `/calendar/${eventId}?from=calendar`;
}

/** @deprecated Use eventsEventDetailPath */
export function whatsOnEventDetailPath(
  eventId: string,
  section: "tournaments" | "skillsClinics" | "socials",
) {
  return eventsEventDetailPath(eventId, section);
}

export function resolveEventsBackLink(from: string | undefined) {
  if (
    from === `events-${EVENTS_SECTIONS.tournaments}` ||
    from === `whats-on-${EVENTS_SECTIONS.tournaments}`
  ) {
    return { path: eventsSectionPath("tournaments"), label: "Events" };
  }
  if (
    from === `events-${EVENTS_SECTIONS.skillsClinics}` ||
    from === `whats-on-${EVENTS_SECTIONS.skillsClinics}`
  ) {
    return { path: eventsSectionPath("skillsClinics"), label: "Events" };
  }
  if (
    from === `events-${EVENTS_SECTIONS.socials}` ||
    from === `whats-on-${EVENTS_SECTIONS.socials}`
  ) {
    return { path: eventsSectionPath("socials"), label: "Events" };
  }
  if (
    from === "events" ||
    from === "whats-on" ||
    from?.startsWith("events-") ||
    from?.startsWith("whats-on-")
  ) {
    return { path: "/events", label: "Events" };
  }
  if (from === "calendar") {
    return { path: "/events?view=calendar", label: "Events" };
  }
  return null;
}

/** @deprecated Use resolveEventsBackLink */
export function resolveWhatsOnBackLink(from: string | undefined) {
  return resolveEventsBackLink(from);
}
