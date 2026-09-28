import type { DayKey } from "@/lib/setter-season/types";
import { DAY_KEYS } from "@/lib/setter-season/types";

const DUBLIN = "Europe/Dublin";

/** ISO date (YYYY-MM-DD) for instant in Ireland. */
export function isoDateInTimeZone(date: Date, timeZone = DUBLIN): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function addDays(iso: string, days: number): string {
  const dt = parseIsoDate(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return isoDateInTimeZone(dt, "UTC");
}

export function dayKeyForIso(iso: string): DayKey {
  const dt = parseIsoDate(iso);
  const dow = dt.getUTCDay();
  const map: DayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[dow];
}

export function mondayOnOrBefore(iso: string): string {
  const dt = parseIsoDate(iso);
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - diff);
  return isoDateInTimeZone(dt, "UTC");
}

export function weekContainsDate(weekStarting: string, iso: string): boolean {
  const end = addDays(weekStarting, 7);
  return iso >= weekStarting && iso < end;
}

export function kickOffDateTimeIso(
  matchDate: string,
  kickOff: string,
): Date | null {
  const m = kickOff.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [y, mo, d] = matchDate.split("-").map(Number);
  const hour = Number(m[1]);
  const min = Number(m[2]);
  // Treat kick-off as Europe/Dublin local — approximate with fixed offset (IST)
  return new Date(Date.UTC(y, mo - 1, d, hour - 1, min, 0));
}

export function isWithinHoursBefore(
  now: Date,
  target: Date,
  hours: number,
): boolean {
  const ms = target.getTime() - now.getTime();
  return ms > 0 && ms <= hours * 60 * 60 * 1000;
}

export { DAY_KEYS, DUBLIN };
