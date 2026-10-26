/** Club wall-clock timezone for holiday calendar days. */
const CLUB_TIMEZONE = "Europe/Dublin";

/**
 * Irish public / bank holidays observed by the club for training schedules.
 * Fixed-date holidays that fall on a weekend move to the following Monday
 * (Christmas / St Stephen's use the next available weekdays).
 */

function ymdKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clubYmd(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Gregorian Easter Sunday (Anonymous algorithm). */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

function addDays(
  year: number,
  month: number,
  day: number,
  delta: number,
): { year: number; month: number; day: number } {
  const date = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function weekday(year: number, month: number, day: number) {
  // 0 = Sunday … 6 = Saturday (UTC calendar date)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Move Sat→Mon (+2), Sun→Mon (+1). */
function observedWeekdayHoliday(year: number, month: number, day: number) {
  const dow = weekday(year, month, day);
  if (dow === 6) return addDays(year, month, day, 2);
  if (dow === 0) return addDays(year, month, day, 1);
  return { year, month, day };
}

function firstMondayOfMonth(year: number, month: number) {
  const firstDow = weekday(year, month, 1);
  const day = firstDow === 0 ? 2 : firstDow === 1 ? 1 : 9 - firstDow;
  return { year, month, day };
}

function lastMondayOfMonth(year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDow = weekday(year, month, lastDay);
  const day = lastDow === 1 ? lastDay : lastDay - ((lastDow + 6) % 7);
  return { year, month, day };
}

/** Christmas Day + St Stephen's Day with Irish substitute-day rules. */
function christmasHolidays(year: number) {
  const holidays: Array<{ year: number; month: number; day: number }> = [];
  const christmasDow = weekday(year, 12, 25);
  const stephenDow = weekday(year, 12, 26);

  if (christmasDow === 6) {
    // Sat 25 → Mon 27; Sun 26 → Tue 28
    holidays.push({ year, month: 12, day: 27 }, { year, month: 12, day: 28 });
  } else if (christmasDow === 0) {
    // Sun 25 → Mon 26; Tue 27 for Stephen's
    holidays.push({ year, month: 12, day: 26 }, { year, month: 12, day: 27 });
  } else if (stephenDow === 6) {
    holidays.push({ year, month: 12, day: 25 }, { year, month: 12, day: 28 });
  } else if (stephenDow === 0) {
    holidays.push({ year, month: 12, day: 25 }, { year, month: 12, day: 27 });
  } else {
    holidays.push({ year, month: 12, day: 25 }, { year, month: 12, day: 26 });
  }

  return holidays;
}

export function irishBankHolidaysForYear(year: number): string[] {
  const easter = easterSunday(year);
  const easterMonday = addDays(easter.year, easter.month, easter.day, 1);

  const dates = [
    observedWeekdayHoliday(year, 1, 1),
    observedWeekdayHoliday(year, 3, 17),
    easterMonday,
    firstMondayOfMonth(year, 5),
    firstMondayOfMonth(year, 6),
    firstMondayOfMonth(year, 8),
    lastMondayOfMonth(year, 10),
    ...christmasHolidays(year),
  ];

  return [...new Set(dates.map((d) => ymdKey(d.year, d.month, d.day)))].sort();
}

const holidayCache = new Map<number, Set<string>>();

function holidaySetForYear(year: number) {
  let set = holidayCache.get(year);
  if (!set) {
    set = new Set(irishBankHolidaysForYear(year));
    holidayCache.set(year, set);
  }
  return set;
}

/** True when `date` falls on an Irish bank holiday in Europe/Dublin. */
export function isIrishBankHoliday(date: Date) {
  const key = clubYmd(date);
  const year = Number(key.slice(0, 4));
  return holidaySetForYear(year).has(key);
}
