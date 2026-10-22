/**
 * Sync Jackals D3W fixtures from the official D3W league schedule.
 * Warm-up = 30 minutes before listed match start (Europe/Dublin).
 *
 *   ALLOW_PRODUCTION_FIXTURE_IMPORT=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/sync-d3w-fixtures.ts
 *
 * Dry run:
 *   DRY_RUN=1 npx tsx scripts/sync-d3w-fixtures.ts
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const CLUB_TIMEZONE = "Europe/Dublin";
const TEAM_KEY = "DIV3_WOMENS";

type OfficialFixture = {
  venue: "HOME" | "AWAY";
  opponentName: string;
  matchday: number;
  date: string;
  start: string;
  location: string;
};

/** Official D3W schedule — Jackals fixtures only (listed kick-off times). */
const OFFICIAL: OfficialFixture[] = [
  {
    matchday: 1,
    venue: "HOME",
    opponentName: "BMP Hawks",
    date: "2026-10-11",
    start: "15:30",
    location: "Luttrellstown Comm Centre",
  },
  {
    matchday: 6,
    venue: "HOME",
    opponentName: "Crumlin IESpike",
    date: "2026-10-18",
    start: "10:30",
    location: "Luttrellstown Comm Centre",
  },
  {
    matchday: 3,
    venue: "AWAY",
    opponentName: "Blizzard",
    date: "2026-10-25",
    // Kick-off; warm-up is 30 minutes earlier (14:00).
    start: "14:30",
    location: "Portlaoise College",
  },
  {
    matchday: 4,
    venue: "HOME",
    opponentName: "Galway",
    date: "2026-11-15",
    start: "15:30",
    location: "Luttrellstown Comm Centre",
  },
  {
    matchday: 5,
    venue: "AWAY",
    opponentName: "Gardians Panda",
    date: "2026-11-28",
    start: "12:30",
    location: "Phoenix Sports Centre (Maynooth Univ)",
  },
  {
    matchday: 7,
    venue: "HOME",
    opponentName: "Aer Lingus Kestrels",
    date: "2026-12-13",
    start: "15:30",
    location: "Luttrellstown Comm Centre",
  },
  {
    matchday: 8,
    venue: "AWAY",
    opponentName: "BMP Hawks",
    date: "2027-01-09",
    start: "18:00",
    location: "Ballymun Trinity Comprehensive",
  },
  {
    matchday: 10,
    venue: "HOME",
    opponentName: "Blizzard",
    date: "2027-02-14",
    start: "15:30",
    location: "Luttrellstown Comm Centre",
  },
  {
    matchday: 11,
    venue: "AWAY",
    opponentName: "Galway",
    date: "2027-03-06",
    start: "14:30",
    location: "Colaiste Muire Mathair (Galway)",
  },
  {
    matchday: 12,
    venue: "HOME",
    opponentName: "Gardians Panda",
    date: "2027-03-13",
    start: "12:00",
    location: "Phoenix Sports Centre (Maynooth Univ)",
  },
  {
    matchday: 13,
    venue: "AWAY",
    opponentName: "Crumlin IESpike",
    date: "2027-04-11",
    start: "11:15",
    location: "Tech University Dublin, Tallaght",
  },
  {
    matchday: 14,
    venue: "AWAY",
    opponentName: "Aer Lingus Kestrels",
    date: "2027-04-04",
    start: "11:30",
    location: "ALSAA",
  },
];

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

function clubDateTime(ymd: string, hm: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = hm.split(":").map(Number);
  const asUtcComponents = () =>
    Date.UTC(year!, month! - 1, day!, hour!, minute!, 0);

  let utcMs = asUtcComponents();
  let offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;
  offset = getTimeZoneOffsetMs(new Date(utcMs), CLUB_TIMEZONE);
  utcMs = asUtcComponents() - offset;
  return new Date(utcMs);
}

function minusMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60_000);
}

function normalizeOpponent(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bd3w\b/g, "")
    .replace(/\biespike\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fmt(d: Date) {
  return d.toLocaleString("en-IE", {
    timeZone: CLUB_TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const allow = process.env.ALLOW_PRODUCTION_FIXTURE_IMPORT === "1";
  const looksLocal =
    !dbUrl.includes("/data/") &&
    (dbUrl.includes("dev.db") ||
      dbUrl.includes("file:./") ||
      dbUrl.includes("localhost"));

  if (!dryRun && (!allow || looksLocal)) {
    throw new Error(
      "Refusing to write. Use DRY_RUN=1, or production:\n" +
        "  ALLOW_PRODUCTION_FIXTURE_IMPORT=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/sync-d3w-fixtures.ts",
    );
  }

  const existing = await prisma.teamMatch.findMany({
    where: { trainingTeamKey: TEAM_KEY },
    orderBy: { matchStart: "asc" },
  });

  if (existing.length !== OFFICIAL.length) {
    console.warn(
      `Warning: DB has ${existing.length} D3W fixtures, official list has ${OFFICIAL.length}`,
    );
  }

  const usedIds = new Set<string>();
  const changes: string[] = [];
  const unchanged: string[] = [];

  for (const next of OFFICIAL) {
    const matchStart = clubDateTime(next.date, next.start);
    const warmUpTime = minusMinutes(matchStart, 30);
    const normOpp = normalizeOpponent(next.opponentName);

    const current =
      existing.find(
        (m) =>
          !usedIds.has(m.id) &&
          m.venue === next.venue &&
          normalizeOpponent(m.opponentName) === normOpp,
      ) ??
      existing.find(
        (m) =>
          !usedIds.has(m.id) &&
          normalizeOpponent(m.opponentName) === normOpp,
      );

    if (!current) {
      changes.push(
        `CREATE [${next.venue}] vs ${next.opponentName} · ${fmt(matchStart)} @ ${next.location}`,
      );
      if (!dryRun) {
        await prisma.teamMatch.create({
          data: {
            trainingTeamKey: TEAM_KEY,
            opponentName: next.opponentName,
            venue: next.venue,
            location: next.location,
            warmUpTime,
            matchStart,
            notes: null,
            cancelled: false,
          },
        });
      }
      continue;
    }

    usedIds.add(current.id);

    const diffs: string[] = [];
    if (current.opponentName !== next.opponentName) {
      diffs.push(`opponent: "${current.opponentName}" → "${next.opponentName}"`);
    }
    if (current.venue !== next.venue) {
      diffs.push(`venue: ${current.venue} → ${next.venue}`);
    }
    if (current.location !== next.location) {
      diffs.push(`location: "${current.location}" → "${next.location}"`);
    }
    if (current.matchStart.getTime() !== matchStart.getTime()) {
      diffs.push(`kick-off: ${fmt(current.matchStart)} → ${fmt(matchStart)}`);
    }
    if (current.warmUpTime.getTime() !== warmUpTime.getTime()) {
      diffs.push(`warm-up: ${fmt(current.warmUpTime)} → ${fmt(warmUpTime)}`);
    }
    if (current.notes) {
      diffs.push(`notes cleared (was: ${current.notes})`);
    }

    const label = `MD${String(next.matchday).padStart(2, "0")} [${next.venue}] vs ${next.opponentName}`;
    if (diffs.length === 0) {
      unchanged.push(`${label} · ${fmt(matchStart)} @ ${next.location}`);
    } else {
      changes.push(`${label}\n  ${diffs.join("\n  ")}`);
      if (!dryRun) {
        await prisma.teamMatch.update({
          where: { id: current.id },
          data: {
            opponentName: next.opponentName,
            venue: next.venue,
            location: next.location,
            warmUpTime,
            matchStart,
            notes: null,
            cancelled: false,
          },
        });
      }
    }
  }

  const orphans = existing.filter((m) => !usedIds.has(m.id));
  for (const orphan of orphans) {
    changes.push(
      `REMOVE leftover [${orphan.venue}] vs ${orphan.opponentName} · ${fmt(orphan.matchStart)}`,
    );
    if (!dryRun) {
      await prisma.matchSignup.deleteMany({ where: { matchId: orphan.id } });
      await prisma.teamMatch.delete({ where: { id: orphan.id } });
    }
  }

  console.log(`=== D3W fixture sync (${dryRun ? "DRY RUN" : "APPLIED"}) ===\n`);
  console.log(`Unchanged (${unchanged.length}):`);
  for (const line of unchanged) console.log(`  ✓ ${line}`);
  console.log(`\nChanged (${changes.length}):`);
  for (const line of changes) console.log(`  • ${line}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
