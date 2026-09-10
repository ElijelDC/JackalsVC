/**
 * Import 2026/27 season fixtures into TeamMatch.
 *
 * Sources:
 *   - Home: Jackals Home Fixtures.xlsx (authoritative for all HOME rows)
 *   - Away: jackals-fixture-emails All Opponent Fixtures (AWAY rows only)
 *           + Confirmed Away overrides for times/venues when available
 *
 * Usage (production):
 *   ALLOW_PRODUCTION_FIXTURE_IMPORT=1 \
 *   DATABASE_URL=file:/data/jackals.db \
 *   npx tsx scripts/import-season-fixtures.ts
 *
 * Dry run (no writes):
 *   DRY_RUN=1 npx tsx scripts/import-season-fixtures.ts
 */
import ExcelJS from "exceljs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const CLUB_TIMEZONE = "Europe/Dublin";
const HOME_FILE =
  process.env.HOME_FIXTURES_XLSX ??
  "/Users/viktoriiarostovtseva/Downloads/Jackals Home Fixtures (1).xlsx";
const ALL_FIXTURES_FILE =
  process.env.ALL_FIXTURES_XLSX ??
  "/Users/viktoriiarostovtseva/Downloads/jackals-fixture-emails-2026-27.xlsx";

const TEAM_KEY_BY_LABEL: Record<string, string> = {
  "d2 men": "DIV2_MENS",
  d2m: "DIV2_MENS",
  "d3 women": "DIV3_WOMENS",
  d3w: "DIV3_WOMENS",
  "d3 men": "DIVISION_3_MENS",
  d3m: "DIVISION_3_MENS",
};

type FixtureSeed = {
  trainingTeamKey: string;
  opponentName: string;
  venue: "HOME" | "AWAY";
  location: string;
  warmUpTime: Date;
  matchStart: Date;
  notes: string | null;
  source: string;
};

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text.trim();
    if (typeof obj.result === "string" || typeof obj.result === "number") {
      return String(obj.result).trim();
    }
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((part) => String((part as { text?: string }).text ?? ""))
        .join("")
        .trim();
    }
  }
  return String(value).trim();
}

function resolveTeamKey(label: string): string {
  const key = TEAM_KEY_BY_LABEL[label.trim().toLowerCase()];
  if (!key) throw new Error(`Unknown team label: ${label}`);
  return key;
}

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
  if (!match) throw new Error(`Invalid datetime: ${value}`);

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

function pad(n: number, width = 2) {
  return String(n).padStart(width, "0");
}

function ymdFromValue(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Excel date cells often come as UTC midnight for the calendar day.
    return value.toISOString().slice(0, 10);
  }
  const text = cellText(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (match) {
    const month = months[match[2]!.slice(0, 3).toLowerCase()];
    if (!month) throw new Error(`Could not parse date: ${text}`);
    return `${match[3]}-${month}-${pad(Number(match[1]))}`;
  }

  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  throw new Error(`Could not parse date: ${text}`);
}

function hmFromValue(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Excel time-only serials show as 1899-12-30THH:MM:SS.000Z
    return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
  }
  const text = cellText(value);
  if (!text || text === "—" || text === "-") return null;

  const range = text.match(/^(\d{1,2}):(\d{2})\s*[–—-]/);
  if (range) return `${pad(Number(range[1]))}:${range[2]}`;

  const single = text.match(/^(\d{1,2}):(\d{2})$/);
  if (single) return `${pad(Number(single[1]))}:${single[2]}`;

  throw new Error(`Could not parse time: ${text}`);
}

function clubDateTime(ymd: string, hm: string): Date {
  return parseDatetimeLocalAsClubTime(`${ymd}T${hm}`);
}

async function loadHomeFixtures(path: string): Promise<FixtureSeed[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Fixtures");
  if (!ws) throw new Error(`No Fixtures sheet in ${path}`);

  const out: FixtureSeed[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as unknown[]).slice(1);
    const dateRaw = values[0];
    const warmRaw = values[1];
    const startRaw = values[2];
    const teamRaw = cellText(values[5]);
    const opponent = cellText(values[6]);
    const location = cellText(values[7]);

    if (!opponent || teamRaw.toLowerCase() === "team") return;
    if (!TEAM_KEY_BY_LABEL[teamRaw.toLowerCase()]) return;
    if (TEAM_KEY_BY_LABEL[opponent.toLowerCase()]) return;

    let ymd: string;
    try {
      ymd = ymdFromValue(dateRaw);
    } catch {
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || Number(ymd.slice(0, 4)) < 2026) {
      return;
    }
    const warmHm = hmFromValue(warmRaw);
    const startHm = hmFromValue(startRaw);
    if (!warmHm || !startHm) {
      throw new Error(`Home fixture missing times: ${teamRaw} vs ${opponent} on ${ymd}`);
    }

    out.push({
      trainingTeamKey: resolveTeamKey(teamRaw),
      opponentName: opponent,
      venue: "HOME",
      location: location || "Luttrellstown",
      warmUpTime: clubDateTime(ymd, warmHm),
      matchStart: clubDateTime(ymd, startHm),
      notes: null,
      source: "home-fixtures",
    });
  });

  return out;
}

type ConfirmedAway = {
  ymd: string;
  teamKey: string;
  warmHm: string;
  startHm: string;
  location: string;
  notes: string | null;
};

async function loadConfirmedAway(path: string): Promise<ConfirmedAway[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Confirmed Away");
  if (!ws) return [];

  const out: ConfirmedAway[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as unknown[]).slice(1);
    const status = cellText(values[0]).toLowerCase();
    if (!status.startsWith("confirmed")) return;

    const team = cellText(values[2]);
    const dateText = cellText(values[4]);
    const warm = hmFromValue(values[6]);
    const start = hmFromValue(values[7]);
    const location = cellText(values[8]) || "Away venue TBC";
    const notes = cellText(values[9]) || null;
    if (!warm || !start) return;

    out.push({
      ymd: ymdFromValue(dateText),
      teamKey: resolveTeamKey(team),
      warmHm: warm,
      startHm: start,
      location,
      notes,
    });
  });

  return out;
}

async function loadAwayFixtures(
  path: string,
  confirmed: ConfirmedAway[],
): Promise<FixtureSeed[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("All Opponent Fixtures");
  if (!ws) throw new Error(`No All Opponent Fixtures sheet in ${path}`);

  const out: FixtureSeed[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as unknown[]).slice(1);
    const ha = cellText(values[5]).toUpperCase();
    if (ha !== "AWAY") return;

    const team = cellText(values[4]);
    const opponent = cellText(values[6]);
    if (!opponent || !TEAM_KEY_BY_LABEL[team.toLowerCase()]) return;

    const ymd = ymdFromValue(values[0]);
    const teamKey = resolveTeamKey(team);
    const confirmedMatch = confirmed.find(
      (item) => item.ymd === ymd && item.teamKey === teamKey,
    );

    const warmFromSheet = hmFromValue(values[7]);
    const startFromSheet = hmFromValue(values[8]);

    let warmHm = confirmedMatch?.warmHm ?? warmFromSheet;
    let startHm = confirmedMatch?.startHm ?? startFromSheet;
    let location = confirmedMatch?.location ?? "Away venue TBC";
    let notes = confirmedMatch?.notes ?? null;

    if (!warmHm || !startHm) {
      warmHm = "13:30";
      startHm = "14:00";
      notes = [
        notes,
        "Warm-up/kick-off provisional (14:00) — awaiting opponent confirmation.",
      ]
        .filter(Boolean)
        .join(" ");
    }

    out.push({
      trainingTeamKey: teamKey,
      opponentName: opponent,
      venue: "AWAY",
      location,
      warmUpTime: clubDateTime(ymd, warmHm),
      matchStart: clubDateTime(ymd, startHm),
      notes,
      source: confirmedMatch ? "confirmed-away" : "emails-away",
    });
  });

  return out;
}

function fixtureKey(f: FixtureSeed) {
  return `${f.trainingTeamKey}|${f.venue}|${f.matchStart.toISOString().slice(0, 10)}|${f.opponentName.toLowerCase()}`;
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
      "Refusing to write fixtures. Use DRY_RUN=1 to preview, or production:\n" +
        "  ALLOW_PRODUCTION_FIXTURE_IMPORT=1 DATABASE_URL=file:/data/jackals.db npx tsx scripts/import-season-fixtures.ts",
    );
  }

  const home = await loadHomeFixtures(HOME_FILE);
  const confirmed = await loadConfirmedAway(ALL_FIXTURES_FILE);
  const away = await loadAwayFixtures(ALL_FIXTURES_FILE, confirmed);
  const fixtures = [...home, ...away].sort(
    (a, b) => a.matchStart.getTime() - b.matchStart.getTime(),
  );

  const keys = new Set<string>();
  for (const f of fixtures) {
    const key = fixtureKey(f);
    if (keys.has(key)) throw new Error(`Duplicate fixture: ${key}`);
    keys.add(key);
  }

  console.log(`Home fixtures: ${home.length} (from Home Fixtures file)`);
  console.log(`Away fixtures: ${away.length} (emails AWAY + confirmed overrides)`);
  console.log(`Total: ${fixtures.length}`);
  console.log("");

  for (const f of fixtures) {
    const day = f.matchStart.toLocaleString("en-IE", {
      timeZone: CLUB_TIMEZONE,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    console.log(
      `- [${f.venue}] ${f.trainingTeamKey} vs ${f.opponentName} @ ${f.location} · ${day} · ${f.source}`,
    );
  }

  if (dryRun) {
    console.log("\nDry run only — no database writes.");
    return;
  }

  const deleted = await prisma.matchSignup.deleteMany({});
  const deletedMatches = await prisma.teamMatch.deleteMany({});
  await prisma.teamMatch.createMany({
    data: fixtures.map((f) => ({
      trainingTeamKey: f.trainingTeamKey,
      opponentName: f.opponentName,
      venue: f.venue,
      location: f.location,
      warmUpTime: f.warmUpTime,
      matchStart: f.matchStart,
      notes: f.notes,
      cancelled: false,
    })),
  });

  console.log(
    `\nImported ${fixtures.length} fixtures (cleared ${deletedMatches.count} matches / ${deleted.count} signups).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
