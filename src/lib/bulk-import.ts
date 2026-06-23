import { parse as parseDateFns } from "date-fns";
import { parseCsvTable } from "@/lib/csv-utils";
import {
  parseCsvDate,
  parseCsvDateTime,
  parseCsvTime,
  safeFormatDate,
} from "@/lib/csv-date-parse";
import type { BulkImportType } from "@/lib/bulk-import-config";
import { syncClubTeamsForSquadKey } from "@/lib/club-team-roster-sync";
import { toManualEventData } from "@/lib/manual-event-data";
import { prisma } from "@/lib/prisma";
import { isTrainingSquadKey } from "@/lib/training-squads";
import { syncTrainingSessionEvents } from "@/lib/training-events";
import {
  SESSION_CATEGORIES,
  type SessionCategory,
  toTrainingSessionData,
} from "@/lib/training-utils";
import { isValidVlyNumberFormat, normalizeVlyNumber } from "@/lib/vly-number";
import { DAYS_OF_WEEK } from "@/lib/utils";
import {
  clubMemberCreateSchema,
  eventSchema,
  teamMatchSchema,
  trainingSessionSchema,
} from "@/lib/validations";
import type { z } from "zod";

export type { BulkImportType } from "@/lib/bulk-import-config";
export {
  BULK_IMPORT_TYPES,
  getBulkImportTemplateMeta,
  isBulkImportType,
} from "@/lib/bulk-import-config";
export { exportBulkImportCsv } from "@/lib/bulk-import-export";

export type BulkImportRowError = {
  row: number;
  message: string;
};

export type BulkImportResult = {
  fileName: string | null;
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  errors: BulkImportRowError[];
};

type TrainingSessionData = ReturnType<typeof toTrainingSessionData>;
type ParsedTrainingSession = z.infer<typeof trainingSessionSchema>;
type ParsedTeamMatch = z.infer<typeof teamMatchSchema>;
type ParsedEvent = z.infer<typeof eventSchema>;

function parseBool(value: string | undefined, fallback = false): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["yes", "true", "1", "y"].includes(normalized)) return true;
  if (["no", "false", "0", "n"].includes(normalized)) return false;
  return fallback;
}

function parseOptional(value: string | undefined): string | undefined {
  const trimmed = (value ?? "").trim();
  return trimmed || undefined;
}

function parseDayOfWeek(value: string | undefined): number | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

  const asNumber = Number.parseInt(trimmed, 10);
  if (!Number.isNaN(asNumber) && asNumber >= 0 && asNumber <= 6) {
    return asNumber;
  }

  const index = DAYS_OF_WEEK.findIndex(
    (day) => day.toLowerCase() === trimmed.toLowerCase(),
  );
  return index >= 0 ? index : null;
}

function rowIsEmpty(row: Record<string, string>): boolean {
  return Object.values(row).every((value) => !value.trim());
}

function emptyResult(fileName: string | null): BulkImportResult {
  return {
    fileName,
    scanned: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function fingerprintDate(value: Date | null | undefined): string {
  return safeFormatDate(value, "yyyy-MM-dd");
}

function fingerprintDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return safeFormatDate(date, "yyyy-MM-dd'T'HH:mm");
}

function rosterFingerprint(vlyNumber: string): string {
  return normalizeVlyNumber(vlyNumber);
}

function trainingSessionFingerprint(
  category: SessionCategory,
  data: TrainingSessionData,
): string {
  const parts = [
    category,
    normalizeText(data.title),
    normalizeText(data.trainingTeamKey),
    data.recurring ? "recurring" : "oneoff",
  ];

  if (data.recurring) {
    parts.push(
      String(data.dayOfWeek),
      String(data.recurrenceWeeks),
      fingerprintDate(data.recurringFrom),
      fingerprintDate(data.recurringTo),
      data.startTime,
      data.endTime,
      normalizeText(data.location),
      normalizeText(data.level),
    );
  } else {
    parts.push(
      fingerprintDate(data.sessionDate),
      data.startTime,
      data.endTime,
      normalizeText(data.location),
      normalizeText(data.level),
    );
  }

  if (category === SESSION_CATEGORIES.FUN) {
    parts.push(data.sessionFee != null ? String(data.sessionFee) : "");
  }

  return parts.join("|");
}

function matchFingerprint(data: ParsedTeamMatch): string {
  return [
    data.trainingTeamKey,
    normalizeText(data.opponentName),
    fingerprintDateTime(data.matchStart),
    data.venue,
    normalizeText(data.location),
  ].join("|");
}

function eventFingerprint(data: ParsedEvent): string {
  return [
    normalizeText(data.title),
    data.type,
    fingerprintDateTime(data.startDate),
  ].join("|");
}

async function loadExistingRosterFingerprints(): Promise<Set<string>> {
  const members = await prisma.clubMember.findMany({
    select: { vlyNumber: true },
  });
  return new Set(members.map((member) => rosterFingerprint(member.vlyNumber)));
}

async function loadExistingTrainingSessionFingerprints(
  category: SessionCategory,
): Promise<Set<string>> {
  const sessions = await prisma.trainingSession.findMany({
    where: { category },
  });
  return new Set(
    sessions.map((session) =>
      trainingSessionFingerprint(category, {
        title: session.title,
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location,
        level: session.level,
        description: session.description,
        coach: session.coach,
        attendanceUrl: session.attendanceUrl,
        paymentUrl: session.paymentUrl,
        reclubUsername: session.reclubUsername,
        sessionFee: session.sessionFee,
        recurring: session.recurring,
        recurrenceWeeks: session.recurrenceWeeks,
        trainingTeamKey: session.trainingTeamKey,
        recurringFrom: session.recurringFrom,
        recurringTo: session.recurringTo,
        sessionDate: session.sessionDate,
      }),
    ),
  );
}

async function loadExistingMatchFingerprints(): Promise<Set<string>> {
  const matches = await prisma.teamMatch.findMany();
  return new Set(
    matches.map((match) =>
      matchFingerprint({
        trainingTeamKey: match.trainingTeamKey,
        opponentName: match.opponentName,
        venue: match.venue as ParsedTeamMatch["venue"],
        location: match.location,
        warmUpTime: match.warmUpTime.toISOString(),
        matchStart: match.matchStart.toISOString(),
        notes: match.notes ?? undefined,
      }),
    ),
  );
}

async function loadExistingEventFingerprints(): Promise<Set<string>> {
  const events = await prisma.event.findMany({
    where: { trainingSessionId: null },
  });
  return new Set(
    events.map((event) =>
      eventFingerprint({
        title: event.title,
        type: event.type as ParsedEvent["type"],
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString(),
        location: event.location ?? undefined,
        description: event.description ?? undefined,
        attendanceUrl: event.attendanceUrl ?? undefined,
        paymentUrl: event.paymentUrl ?? undefined,
        sessionFee: event.sessionFee ?? undefined,
        reclubUsername: event.reclubUsername ?? undefined,
      }),
    ),
  );
}

function parseTrainingSessionRow(row: Record<string, string>) {
  const recurring = parseBool(row.recurring, true);
  const sessionDate = parseOptional(row.session_date)
    ? parseCsvDate(row.session_date)
    : undefined;
  const recurringFrom = parseOptional(row.recurring_from)
    ? parseCsvDate(row.recurring_from)
    : undefined;
  const recurringTo = parseOptional(row.recurring_to)
    ? parseCsvDate(row.recurring_to)
    : undefined;
  const dayFromRow = parseDayOfWeek(row.day_of_week);
  const dayOfWeek =
    dayFromRow ??
    (sessionDate
      ? parseDateFns(sessionDate, "yyyy-MM-dd", new Date()).getDay()
      : recurring
        ? 1
        : 0);

  return {
    title: row.title?.trim() ?? "",
    trainingTeamKey: row.training_team_key?.trim() || undefined,
    dayOfWeek,
    startTime: row.start_time?.trim() ? parseCsvTime(row.start_time) ?? "" : "",
    endTime: row.end_time?.trim() ? parseCsvTime(row.end_time) ?? "" : "",
    location: row.location?.trim() ?? "",
    level: row.level?.trim() ?? "",
    description: parseOptional(row.description),
    coach: parseOptional(row.coach),
    attendanceUrl: parseOptional(row.attendance_url),
    paymentUrl: parseOptional(row.payment_url),
    reclubUsername: parseOptional(row.reclub_username),
    sessionFee: parseOptional(row.session_fee),
    recurring,
    recurrenceWeeks: Number.parseInt(row.recurrence_weeks || "1", 10) || 1,
    sessionDate,
    recurringFrom,
    recurringTo,
  };
}

async function importRosterRow(
  row: Record<string, string>,
  existing: Set<string>,
  seenInFile: Set<string>,
): Promise<"created" | "skipped"> {
  const vlyNumber = normalizeVlyNumber(row.vly_number ?? "");
  if (!isValidVlyNumberFormat(vlyNumber)) {
    throw new Error("Invalid vly_number (e.g. VLY12345)");
  }

  const fingerprint = rosterFingerprint(vlyNumber);
  if (existing.has(fingerprint) || seenInFile.has(fingerprint)) {
    seenInFile.add(fingerprint);
    return "skipped";
  }

  const parsed = clubMemberCreateSchema.safeParse({
    vlyNumber,
    name: row.name?.trim(),
    trainingTeamKey: row.training_team_key?.trim(),
    rosterRole: (row.roster_role?.trim().toUpperCase() || "PLAYER") as
      | "PLAYER"
      | "COACH",
    coachPaymentType: parseOptional(row.coach_payment_type)?.toUpperCase(),
    active: parseBool(row.active, true),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const data = parsed.data;
  if (!(await isTrainingSquadKey(data.trainingTeamKey))) {
    throw new Error("Invalid training_team_key");
  }

  await prisma.clubMember.create({
    data: {
      vlyNumber,
      name: data.name.trim(),
      trainingTeamKey: data.trainingTeamKey,
      rosterRole: data.rosterRole,
      coachPaymentType:
        data.rosterRole === "COACH" ? (data.coachPaymentType ?? "PAID") : null,
      active: data.active ?? true,
    },
  });

  seenInFile.add(fingerprint);
  existing.add(fingerprint);
  return "created";
}

async function importTrainingSessionRow(
  row: Record<string, string>,
  category: SessionCategory,
  existing: Set<string>,
  seenInFile: Set<string>,
): Promise<"created" | "skipped"> {
  const payload = parseTrainingSessionRow(row);

  if (category === SESSION_CATEGORIES.WEEKLY && !payload.trainingTeamKey) {
    throw new Error("training_team_key is required for weekly training");
  }

  const parsed = trainingSessionSchema.safeParse({
    ...payload,
    trainingTeamKey:
      category === SESSION_CATEGORIES.WEEKLY
        ? payload.trainingTeamKey
        : undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  if (
    category === SESSION_CATEGORIES.FUN &&
    parsed.data.sessionFee == null
  ) {
    throw new Error("session_fee is required for fun sessions");
  }

  if (
    category === SESSION_CATEGORIES.WEEKLY &&
    parsed.data.trainingTeamKey &&
    !(await isTrainingSquadKey(parsed.data.trainingTeamKey))
  ) {
    throw new Error("Invalid training_team_key");
  }

  const sessionData = toTrainingSessionData(parsed.data);
  const fingerprint = trainingSessionFingerprint(category, sessionData);

  if (existing.has(fingerprint) || seenInFile.has(fingerprint)) {
    seenInFile.add(fingerprint);
    return "skipped";
  }

  const session = await prisma.trainingSession.create({
    data: { ...sessionData, category },
  });
  await syncTrainingSessionEvents(session);

  seenInFile.add(fingerprint);
  existing.add(fingerprint);
  return "created";
}

async function importMatchRow(
  row: Record<string, string>,
  existing: Set<string>,
  seenInFile: Set<string>,
): Promise<"created" | "skipped"> {
  const parsed = teamMatchSchema.safeParse({
    trainingTeamKey: row.training_team_key?.trim(),
    opponentName: row.opponent_name?.trim(),
    venue: row.venue?.trim().toUpperCase(),
    location: row.location?.trim(),
    warmUpTime: row.warm_up_time?.trim()
      ? parseCsvDateTime(row.warm_up_time)
      : "",
    matchStart: row.match_start?.trim() ? parseCsvDateTime(row.match_start) : "",
    notes: parseOptional(row.notes),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  if (!(await isTrainingSquadKey(parsed.data.trainingTeamKey))) {
    throw new Error("Invalid training_team_key");
  }

  const fingerprint = matchFingerprint(parsed.data);
  if (existing.has(fingerprint) || seenInFile.has(fingerprint)) {
    seenInFile.add(fingerprint);
    return "skipped";
  }

  await prisma.teamMatch.create({
    data: {
      trainingTeamKey: parsed.data.trainingTeamKey,
      opponentName: parsed.data.opponentName.trim(),
      venue: parsed.data.venue,
      location: parsed.data.location.trim(),
      warmUpTime: new Date(parsed.data.warmUpTime),
      matchStart: new Date(parsed.data.matchStart),
      notes: parsed.data.notes ?? null,
    },
  });

  seenInFile.add(fingerprint);
  existing.add(fingerprint);
  return "created";
}

async function importEventRow(
  row: Record<string, string>,
  existing: Set<string>,
  seenInFile: Set<string>,
): Promise<"created" | "skipped"> {
  const parsed = eventSchema.safeParse({
    title: row.title?.trim(),
    type: row.type?.trim().toUpperCase(),
    startDate: row.start_date?.trim() ? parseCsvDateTime(row.start_date) : "",
    endDate: parseOptional(row.end_date)
      ? parseCsvDateTime(row.end_date)
      : undefined,
    location: parseOptional(row.location),
    description: parseOptional(row.description),
    attendanceUrl: parseOptional(row.attendance_url),
    paymentUrl: parseOptional(row.payment_url),
    sessionFee: parseOptional(row.session_fee),
    reclubUsername: parseOptional(row.reclub_username),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const fingerprint = eventFingerprint(parsed.data);
  if (existing.has(fingerprint) || seenInFile.has(fingerprint)) {
    seenInFile.add(fingerprint);
    return "skipped";
  }

  await prisma.event.create({ data: toManualEventData(parsed.data) });

  seenInFile.add(fingerprint);
  existing.add(fingerprint);
  return "created";
}

export async function runBulkImport(
  type: BulkImportType,
  csvContent: string,
  fileName: string | null,
): Promise<BulkImportResult> {
  const { rows } = parseCsvTable(csvContent);
  if (rows.length === 0) {
    return emptyResult(fileName);
  }

  const result: BulkImportResult = {
    fileName,
    scanned: 0,
    created: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const squadKeysToSync = new Set<string>();
  const seenInFile = new Set<string>();

  const existing =
    type === "roster"
      ? await loadExistingRosterFingerprints()
      : type === "weekly-training"
        ? await loadExistingTrainingSessionFingerprints(SESSION_CATEGORIES.WEEKLY)
        : type === "fun-sessions"
          ? await loadExistingTrainingSessionFingerprints(SESSION_CATEGORIES.FUN)
          : type === "matches"
            ? await loadExistingMatchFingerprints()
            : await loadExistingEventFingerprints();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const rowNumber = index + 2;

    if (rowIsEmpty(row)) continue;

    result.scanned += 1;

    try {
      let outcome: "created" | "skipped";

      if (type === "roster") {
        outcome = await importRosterRow(row, existing, seenInFile);
        if (outcome === "created") {
          const squadKey = row.training_team_key?.trim();
          if (squadKey) squadKeysToSync.add(squadKey);
        }
      } else if (type === "weekly-training") {
        outcome = await importTrainingSessionRow(
          row,
          SESSION_CATEGORIES.WEEKLY,
          existing,
          seenInFile,
        );
      } else if (type === "fun-sessions") {
        outcome = await importTrainingSessionRow(
          row,
          SESSION_CATEGORIES.FUN,
          existing,
          seenInFile,
        );
      } else if (type === "matches") {
        outcome = await importMatchRow(row, existing, seenInFile);
      } else {
        outcome = await importEventRow(row, existing, seenInFile);
      }

      if (outcome === "skipped") {
        result.skipped += 1;
      } else {
        result.created += 1;
      }
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  if (type === "roster") {
    for (const squadKey of squadKeysToSync) {
      if (await isTrainingSquadKey(squadKey)) {
        await syncClubTeamsForSquadKey(squadKey);
      }
    }
  }

  return result;
}
