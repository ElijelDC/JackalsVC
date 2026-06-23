import { format, isValid, parse } from "date-fns";

const DATE_PATTERNS = [
  "yyyy-MM-dd",
  "dd/MM/yyyy",
  "d/M/yyyy",
  "MM/dd/yyyy",
  "M/d/yyyy",
  "dd-MM-yyyy",
  "d-M-yyyy",
  "dd/MM/yy",
  "d/M/yy",
  "dd-MMM-yyyy",
  "d-MMM-yyyy",
  "dd-MMM-yy",
  "d-MMM-yy",
] as const;

const DATETIME_PATTERNS = [
  "yyyy-MM-dd'T'HH:mm",
  "yyyy-MM-dd'T'HH:mm:ss",
  "yyyy-MM-dd HH:mm",
  "yyyy-MM-dd HH:mm:ss",
  "dd/MM/yyyy HH:mm",
  "d/M/yyyy HH:mm",
  "dd/MM/yyyy H:mm",
  "MM/dd/yyyy HH:mm",
  "M/d/yyyy HH:mm",
  "dd-MM-yyyy HH:mm",
  "dd/MM/yyyy HH:mm:ss",
  "dd-MMM-yyyy HH:mm",
  "dd-MMM-yy HH:mm",
] as const;

function excelSerialToDate(serial: number): Date | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  // Excel (Windows) day 1 = 1899-12-30; 25569 = 1970-01-01.
  const utcDays = serial - 25569;
  const date = new Date(utcDays * 86400 * 1000);
  return isValid(date) ? date : null;
}

function tryParseWithPatterns(
  value: string,
  patterns: readonly string[],
): Date | null {
  for (const pattern of patterns) {
    const parsed = parse(value, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    if (numeric > 10_000 && numeric < 100_000) {
      const excelDate = excelSerialToDate(numeric);
      if (excelDate) return excelDate;
    }
    if (numeric > 1_000_000_000_000) {
      const fromMs = new Date(numeric);
      if (isValid(fromMs)) return fromMs;
    }
  }

  const fromPatterns = tryParseWithPatterns(trimmed, DATE_PATTERNS);
  if (fromPatterns) return fromPatterns;

  const fromDatetimePatterns = tryParseWithPatterns(trimmed, DATETIME_PATTERNS);
  if (fromDatetimePatterns) return fromDatetimePatterns;

  const native = new Date(trimmed);
  return isValid(native) ? native : null;
}

/** Normalize a CSV date cell to `yyyy-MM-dd` for import schemas. */
export function parseCsvDate(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = parseFlexibleDate(trimmed);
  if (!parsed) {
    throw new Error(
      `Could not read date "${trimmed}". Use YYYY-MM-DD or format the column as Text in Excel.`,
    );
  }

  return format(parsed, "yyyy-MM-dd");
}

/** Normalize a CSV datetime cell to `yyyy-MM-dd'T'HH:mm`. */
export function parseCsvDateTime(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;

  const parsed = parseFlexibleDate(trimmed);
  if (!parsed) {
    throw new Error(
      `Could not read date/time "${trimmed}". Use YYYY-MM-DDTHH:MM or format the column as Text in Excel.`,
    );
  }

  return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

/** Normalize a CSV time cell to `HH:mm` (24-hour). */
export function parseCsvTime(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return undefined;

  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (twentyFourHour) {
    const hours = Number(twentyFourHour[1]);
    const minutes = Number(twentyFourHour[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    const meridiem = ampm[3]!.toUpperCase();
    if (hours === 12) hours = 0;
    if (meridiem === "PM") hours += 12;
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric < 1) {
    const totalMinutes = Math.round(numeric * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (Number.isFinite(numeric) && numeric >= 1) {
    const excelDate = excelSerialToDate(numeric);
    if (excelDate) {
      return format(excelDate, "HH:mm");
    }
  }

  throw new Error(
    `Could not read time "${trimmed}". Use HH:MM (e.g. 19:00) or format the column as Text in Excel.`,
  );
}

export function safeFormatDate(
  value: Date | null | undefined,
  pattern: string,
): string {
  if (!value || !isValid(value)) return "";
  return format(value, pattern);
}
