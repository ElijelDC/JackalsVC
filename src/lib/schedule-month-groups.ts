import { startOfMonth } from "date-fns";
import { formatTrainingMonthParam } from "@/lib/training-teams-config";

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
