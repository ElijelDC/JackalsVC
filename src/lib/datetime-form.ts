import { format } from "date-fns";

/** Club wall-clock timezone for one-off session admin forms. */
export const CLUB_TIMEZONE = "Europe/Dublin";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Offset of `timeZone` ahead of UTC at the given instant, in ms. */
function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

/**
 * Parse a `datetime-local` value (`YYYY-MM-DDTHH:mm`) as club wall-clock time
 * (Europe/Dublin) and return the corresponding UTC `Date`.
 *
 * Important on UTC servers: `new Date("2026-08-08T19:00")` is treated as local
 * to the host, so Ireland wall times would be stored one hour off in summer.
 */
export function parseDatetimeLocalAsClubTime(value: string): Date {
  const trimmed = value.trim();
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(trimmed);

  if (!match) {
    const fallback = new Date(trimmed);
    if (Number.isNaN(fallback.getTime())) {
      throw new Error(`Invalid datetime: ${value}`);
    }
    return fallback;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const asUtcComponents = () =>
    Date.UTC(year, month - 1, day, hour, minute, second);

  // First guess, then correct around DST transitions.
  let utcMs = asUtcComponents();
  let offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;
  offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;

  return new Date(utcMs);
}

/**
 * Combine a calendar date with `HH:mm` wall-clock time in Europe/Dublin.
 * Use when building UTC instants from training session start/end times.
 */
export function applyClubWallTimeToDate(date: Date, time: string): Date {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) {
    throw new Error(`Invalid time: ${time}`);
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const parts = getZonedParts(date, CLUB_TIMEZONE);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  const value = `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(hour)}:${pad(minute)}`;
  return parseDatetimeLocalAsClubTime(value);
}

/** Format an ISO date for `<input type="datetime-local">` in Europe/Dublin. */
export function toClubDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = getZonedParts(date, CLUB_TIMEZONE);
  const pad = (n: number, width = 2) => String(n).padStart(width, "0");
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Format an ISO date string for `<input type="datetime-local">` in local time. */
export function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

export function formatInClubTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
  locale = "en-IE",
) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    timeZone: CLUB_TIMEZONE,
    ...options,
  }).format(date);
}
