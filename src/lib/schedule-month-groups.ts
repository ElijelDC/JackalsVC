import {
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { formatTrainingMonthParam } from "@/lib/training-teams-config";

/** Ireland / club week: Monday start. */
export const SCHEDULE_WEEK_OPTIONS = { weekStartsOn: 1 as const };

/**
 * Calendar month plus the incomplete weeks that spill into the previous/next
 * month, so coaches don't have to flip months mid-week to see nearby sessions.
 */
export function getScheduleMonthWindow(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return {
    monthStart,
    monthEnd,
    rangeStart: startOfWeek(monthStart, SCHEDULE_WEEK_OPTIONS),
    rangeEnd: endOfWeek(monthEnd, SCHEDULE_WEEK_OPTIONS),
  };
}

export function groupItemsByMonthParam<T>(
  items: T[],
  getDate: (item: T) => Date,
): [string, T[]][] {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const key = formatTrainingMonthParam(startOfMonth(getDate(item)));
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }

  return [...map.entries()].sort(([left], [right]) => left.localeCompare(right));
}
