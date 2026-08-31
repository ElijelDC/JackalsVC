/**
 * Rebuild calendar Event rows from TrainingSession start/end times.
 * Self-contained so it runs inside the production Docker image (no src/lib copy).
 *
 * Usage (production):
 *   docker compose exec -T app npx tsx scripts/resync-training-events.ts
 */
import "dotenv/config";
import { addWeeks, endOfDay, startOfDay } from "date-fns";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  PrismaClient,
  type TrainingOccurrenceException,
  type TrainingSession,
} from "../src/generated/prisma/client";

const CLUB_TIMEZONE = "Europe/Dublin";
const TRAINING_CALENDAR_WEEKS = 12;
const MAX_OCCURRENCES = 104;

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

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

function parseDatetimeLocalAsClubTime(value: string): Date {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid datetime: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? "0");
  const asUtcComponents = () =>
    Date.UTC(year, month - 1, day, hour, minute, second);

  let utcMs = asUtcComponents();
  let offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;
  offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;

  return new Date(utcMs);
}

function applyClubWallTimeToDate(date: Date, time: string): Date {
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

function startOfOccurrenceDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function occurrenceDateKey(date: Date) {
  return startOfOccurrenceDay(date).toISOString();
}

function calendarEventTypeForCategory(category: string) {
  return category === "FUN" ? "FUN" : "TRAINING";
}

function buildTrainingEventDescription(session: TrainingSession) {
  const parts: string[] = [];
  if (session.level) parts.push(session.level);
  if (session.coach) parts.push(`Coach: ${session.coach}`);
  if (session.description) parts.push(session.description);
  return parts.join(" · ");
}

function firstOccurrenceOnOrAfter(from: Date, dayOfWeek: number) {
  const date = startOfDay(from);
  const daysUntil = (dayOfWeek - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

type EventOccurrence = {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: string;
  location: string;
  trainingSessionId: string;
  trainingOccurrenceDate: Date;
};

function buildEventPayload(
  session: TrainingSession,
  occurrenceDate: Date,
  startDate: Date,
  endDate: Date,
): EventOccurrence {
  return {
    title: session.title,
    description: buildTrainingEventDescription(session),
    startDate,
    endDate,
    type: calendarEventTypeForCategory(session.category),
    location: session.location,
    trainingSessionId: session.id,
    trainingOccurrenceDate: startOfOccurrenceDay(occurrenceDate),
  };
}

function applyOverride(
  session: TrainingSession,
  occurrenceDate: Date,
  defaultStart: Date,
  defaultEnd: Date,
  override: TrainingOccurrenceException,
): EventOccurrence {
  if (override.cancelled) {
    return buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd);
  }

  return {
    title: override.title ?? session.title,
    description: override.description ?? buildTrainingEventDescription(session),
    startDate: override.startDate ?? defaultStart,
    endDate: override.endDate ?? defaultEnd,
    type: calendarEventTypeForCategory(session.category),
    location: override.location ?? session.location,
    trainingSessionId: session.id,
    trainingOccurrenceDate: startOfOccurrenceDay(occurrenceDate),
  };
}

function buildTrainingOccurrences(
  session: TrainingSession,
  overrides = new Map<string, TrainingOccurrenceException>(),
) {
  if (!session.recurring) {
    if (!session.sessionDate) return [];

    const day = new Date(session.sessionDate);
    const occurrenceDate = startOfOccurrenceDay(day);
    const defaultStart = applyClubWallTimeToDate(day, session.startTime);
    const defaultEnd = applyClubWallTimeToDate(day, session.endTime);
    const override = overrides.get(occurrenceDateKey(occurrenceDate));

    if (override) {
      return [
        applyOverride(
          session,
          occurrenceDate,
          defaultStart,
          defaultEnd,
          override,
        ),
      ];
    }

    return [buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd)];
  }

  const interval = session.recurrenceWeeks || 1;
  const rangeStart = startOfDay(session.recurringFrom ?? new Date());
  const rangeEnd = endOfDay(
    session.recurringTo ?? addWeeks(rangeStart, TRAINING_CALENDAR_WEEKS),
  );

  const occurrences: EventOccurrence[] = [];
  let current = firstOccurrenceOnOrAfter(rangeStart, session.dayOfWeek);

  while (current <= rangeEnd && occurrences.length < MAX_OCCURRENCES) {
    const occurrenceDate = startOfOccurrenceDay(current);
    const defaultStart = applyClubWallTimeToDate(current, session.startTime);
    const defaultEnd = applyClubWallTimeToDate(current, session.endTime);
    const override = overrides.get(occurrenceDateKey(occurrenceDate));

    if (override) {
      occurrences.push(
        applyOverride(
          session,
          occurrenceDate,
          defaultStart,
          defaultEnd,
          override,
        ),
      );
    } else {
      occurrences.push(
        buildEventPayload(session, occurrenceDate, defaultStart, defaultEnd),
      );
    }

    current = addWeeks(current, interval);
  }

  return occurrences;
}

async function getOccurrenceOverridesMap(sessionId: string) {
  const overrides = await prisma.trainingOccurrenceException.findMany({
    where: { trainingSessionId: sessionId },
  });

  return new Map(
    overrides.map((override) => [
      occurrenceDateKey(override.occurrenceDate),
      override,
    ]),
  );
}

async function syncTrainingSessionEvents(session: TrainingSession) {
  const overrides = await getOccurrenceOverridesMap(session.id);

  await prisma.event.deleteMany({
    where: { trainingSessionId: session.id },
  });

  const occurrences = buildTrainingOccurrences(session, overrides);
  if (occurrences.length > 0) {
    await prisma.event.createMany({ data: occurrences });
  }
}

async function main() {
  const sessions = await prisma.trainingSession.findMany();
  console.log(`Resyncing ${sessions.length} training session(s)...`);

  for (const session of sessions) {
    await syncTrainingSessionEvents(session);
    console.log(`  ${session.title} (${session.startTime}–${session.endTime})`);
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
