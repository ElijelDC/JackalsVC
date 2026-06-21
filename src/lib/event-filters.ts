import {
  addWeeks,
  endOfDay,
  endOfMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";

export type EventListItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
  trainingSessionId?: string | null;
  trainingOccurrenceDate?: string | null;
  occurrenceCustomized?: boolean;
  coach?: string | null;
  attendanceUrl?: string | null;
  paymentUrl?: string | null;
  reclubUsername?: string | null;
  sessionFee?: number | null;
  clubIban?: string | null;
  sessionDescription?: string | null;
  sessionCategory?: string | null;
};

export type EventSourceFilter = "all" | "training" | "manual";

export const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "TRAINING", label: "Training" },
  { value: "FUN", label: "Fun Sessions" },
  { value: "TOURNAMENT", label: "Tournament" },
  { value: "SOCIAL", label: "Skills Clinics" },
  { value: "MEETING", label: "Meeting" },
] as const;

export const MEMBER_ONLY_EVENT_TYPES = ["TRAINING", "MEETING"] as const;

export function getEventTypeLabel(type: string): string {
  const option = EVENT_TYPE_OPTIONS.find((o) => o.value === type);
  return option?.label ?? type;
}

export function getEventTypeOptions(isLoggedIn: boolean) {
  if (isLoggedIn) return EVENT_TYPE_OPTIONS;
  return EVENT_TYPE_OPTIONS.filter(
    (option) =>
      !MEMBER_ONLY_EVENT_TYPES.includes(
        option.value as (typeof MEMBER_ONLY_EVENT_TYPES)[number],
      ),
  );
}

export function filterEventsForViewer<T extends { type: string }>(
  events: T[],
  isLoggedIn: boolean,
): T[] {
  if (isLoggedIn) return events;
  return events.filter(
    (event) =>
      !MEMBER_ONLY_EVENT_TYPES.includes(
        event.type as (typeof MEMBER_ONLY_EVENT_TYPES)[number],
      ),
  );
}

export const FUN_SESSION_CALENDAR_WEEKS = 3;

export function filterFunSessionsWithinCalendarHorizon<
  T extends { type: string; startDate: string | Date },
>(
  events: T[],
  weeksAhead = FUN_SESSION_CALENDAR_WEEKS,
  now = new Date(),
): T[] {
  const through = addWeeks(now, weeksAhead);

  return events.filter((event) => {
    if (event.type !== "FUN") return true;
    return new Date(event.startDate) <= through;
  });
}

export const EVENT_SOURCE_OPTIONS = [
  { value: "all", label: "All events" },
  { value: "training", label: "From training" },
  { value: "manual", label: "Manual only" },
] as const;

function matchesSearch(query: string, ...fields: string[]) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => field.toLowerCase().includes(q));
}

export function filterEvents(
  events: EventListItem[],
  options: {
    search?: string;
    type?: string;
    source?: EventSourceFilter;
    month?: string;
    fromDate?: string;
    toDate?: string;
  },
): EventListItem[] {
  const {
    search = "",
    type = "",
    source = "all",
    month = "",
    fromDate = "",
    toDate = "",
  } = options;

  return events.filter((event) => {
    if (type && event.type !== type) return false;

    if (source === "training" && !event.trainingSessionId) return false;
    if (source === "manual" && event.trainingSessionId) return false;

    const start = new Date(event.startDate);

    if (month) {
      const [year, monthIndex] = month.split("-").map(Number);
      const rangeStart = startOfMonth(new Date(year, monthIndex - 1));
      const rangeEnd = endOfMonth(rangeStart);
      if (start < rangeStart || start > rangeEnd) return false;
    }

    if (fromDate && start < startOfDay(parseISO(fromDate))) return false;
    if (toDate && start > endOfDay(parseISO(toDate))) return false;

    return matchesSearch(
      search,
      event.title,
      event.description ?? "",
      event.type,
      event.location ?? "",
    );
  });
}

export function hasActiveEventFilters(options: {
  search?: string;
  type?: string;
  source?: EventSourceFilter;
  month?: string;
  fromDate?: string;
  toDate?: string;
}): boolean {
  const {
    search = "",
    type = "",
    source = "all",
    month = "",
    fromDate = "",
    toDate = "",
  } = options;

  return Boolean(
    search.trim() ||
      type ||
      source !== "all" ||
      month ||
      fromDate ||
      toDate,
  );
}
