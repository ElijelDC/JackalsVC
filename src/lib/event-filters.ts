import {
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
};

export type EventSourceFilter = "all" | "training" | "manual";

export const EVENT_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "TRAINING", label: "Training" },
  { value: "TOURNAMENT", label: "Tournament" },
  { value: "SOCIAL", label: "Social" },
  { value: "MEETING", label: "Meeting" },
] as const;

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
