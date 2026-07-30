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
  reclubReferenceCode?: string | null;
};

/** @deprecated Use EventsCalendarEvent */
export type WhatsOnCalendarEvent = EventsCalendarEvent;

export function isSkillsClinicEvent(event: {
  title: string;
  description: string | null;
}) {
  return /clinic|workshop/i.test(`${event.title} ${event.description ?? ""}`);
}

export const MANUAL_EVENT_TYPES = [
  "TOURNAMENT",
  "SKILLS_CLINIC",
  "SOCIAL",
] as const;

export type ManualEventType = (typeof MANUAL_EVENT_TYPES)[number];

export const MANUAL_EVENT_TYPE_LABELS: Record<ManualEventType, string> = {
  TOURNAMENT: "Tournament",
  SKILLS_CLINIC: "Skills Clinics",
  SOCIAL: "Social Activities",
};

export function getManualEventTypeLabel(type: string) {
  return (
    MANUAL_EVENT_TYPE_LABELS[type as ManualEventType] ??
    type.replaceAll("_", " ").toLowerCase()
  );
}

export function normalizeManualEventType(event: {
  type: string;
  title: string;
  description?: string | null;
}): ManualEventType {
  if (event.type === "MEETING") {
    return "SOCIAL";
  }

  if (
    event.type === "SOCIAL" &&
    isSkillsClinicEvent({
      title: event.title,
      description: event.description ?? null,
    })
  ) {
    return "SKILLS_CLINIC";
  }

  if (MANUAL_EVENT_TYPES.includes(event.type as ManualEventType)) {
    return event.type as ManualEventType;
  }

  return "TOURNAMENT";
}

export function splitSocialCalendarEvents(events: EventsCalendarEvent[]) {
  const skillsClinics = events.filter(
    (event) =>
      event.type === "SKILLS_CLINIC" ||
      (event.type === "SOCIAL" && isSkillsClinicEvent(event)),
  );
  const socials = events.filter(
    (event) => event.type === "SOCIAL" && !isSkillsClinicEvent(event),
  );
  return { skillsClinics, socials };
}

export function getSocialCalendarEventLabel(event: {
  type?: string;
  title: string;
  description?: string | null;
}) {
  if (event.type === "SKILLS_CLINIC") {
    return MANUAL_EVENT_TYPE_LABELS.SKILLS_CLINIC;
  }

  if (event.type === "SOCIAL") {
    return MANUAL_EVENT_TYPE_LABELS.SOCIAL;
  }

  return isSkillsClinicEvent({
    title: event.title,
    description: event.description ?? null,
  })
    ? MANUAL_EVENT_TYPE_LABELS.SKILLS_CLINIC
    : MANUAL_EVENT_TYPE_LABELS.SOCIAL;
}

export function getBrowseEventTypeLabel(event: {
  type: string;
  title: string;
  description?: string | null;
}) {
  if (event.type === "SKILLS_CLINIC" || event.type === "SOCIAL") {
    return getSocialCalendarEventLabel(event);
  }

  const labels: Record<string, string> = {
    TOURNAMENT: MANUAL_EVENT_TYPE_LABELS.TOURNAMENT,
    FUN: "Fun session",
    TRAINING: "Training",
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
  section: "funSessions" | "tournaments" | "skillsClinics" | "socials",
) {
  return `/calendar/${eventId}?from=events-${EVENTS_SECTIONS[section]}`;
}

export function eventsCalendarEventDetailPath(eventId: string) {
  return `/calendar/${eventId}?from=calendar`;
}

/** @deprecated Use eventsEventDetailPath */
export function whatsOnEventDetailPath(
  eventId: string,
  section: "funSessions" | "tournaments" | "skillsClinics" | "socials",
) {
  return eventsEventDetailPath(eventId, section);
}

export function resolveEventsBackLink(from: string | undefined) {
  if (from === "dashboard") {
    return { path: "/dashboard", label: "Dashboard" };
  }
  if (
    from === `events-${EVENTS_SECTIONS.funSessions}` ||
    from === `whats-on-${EVENTS_SECTIONS.funSessions}`
  ) {
    return { path: eventsSectionPath("funSessions"), label: "Events" };
  }
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
