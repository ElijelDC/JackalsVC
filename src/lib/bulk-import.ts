import { parse as parseDateFns } from "date-fns";
import {
  parseCsvDate,
  parseCsvDateTime,
  parseCsvTime,
  safeFormatDate,
} from "@/lib/csv-date-parse";
import type { BulkImportType } from "@/lib/bulk-import-config";
import { planRosterRemovals, rosterFingerprint } from "@/lib/bulk-import-roster-plan";
import {
  setClubMemberCoachSquads,
  syncClubTeamsForSquadKey,
} from "@/lib/club-team-roster-sync";
import { toManualEventData } from "@/lib/manual-event-data";
import { normalizePlayerPaymentType } from "@/lib/player-payment-type";
import { prisma } from "@/lib/prisma";
import { isTrainingSquadKey } from "@/lib/training-squads";
import {
  deleteTrainingSessionCascade,
  syncTrainingSessionEvents,
} from "@/lib/training-events";
import {
  SESSION_CATEGORIES,
  type SessionCategory,
  toTrainingSessionData,
} from "@/lib/training-utils";
import {
  isValidClubMemberNumberForRole,
  isValidVlyCoachNumberFormat,
  normalizeVlyNumber,
} from "@/lib/vly-number";
import { DAYS_OF_WEEK } from "@/lib/utils";
import {
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
export {
  exportBulkImportCsv,
  exportBulkImportExcel,
} from "@/lib/bulk-import-export";
export { planRosterRemovals, rosterFingerprint } from "@/lib/bulk-import-roster-plan";

export type BulkImportRowError = {
  row: number;
  message: string;
};

export type BulkImportResult = {
  fileName: string | null;
  scanned: number;
  created: number;
  updated: number;
  removed: number;
  /** @deprecated Kept for older clients; always 0 under override mode. */
  skipped: number;
  failed: number;
  errors: BulkImportRowError[];
  /** True when removals require an explicit confirmDestructive flag. */
  needsConfirmation?: boolean;
  plannedRemovals?: number;
};

export type BulkImportOptions = {
  confirmDestructive?: boolean;
};

type TrainingSessionData = ReturnType<typeof toTrainingSessionData>;
type ParsedTeamMatch = z.infer<typeof teamMatchSchema>;
type ParsedEvent = z.infer<typeof eventSchema>;

type ParsedRosterRow = {
  rowNumber: number;
  fingerprint: string;
  vlyNumber: string;
  name: string;
  rosterRole: "PLAYER" | "COACH";
  squadKeys: string[];
  coachPaymentType: "PAID" | "VOLUNTEER" | null;
  playerPaymentType: "MEMBERSHIP" | "PAYG";
  active: boolean;
};

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
    updated: 0,
    removed: 0,
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

async function parseRosterRow(
  row: Record<string, string>,
  rowNumber: number,
): Promise<ParsedRosterRow> {
  const vlyNumber = normalizeVlyNumber(row.vly_number ?? "");
  const rawRosterRole = row.roster_role?.trim().toUpperCase();
  const rosterRole =
    rawRosterRole === "PLAYER" || rawRosterRole === "COACH"
      ? rawRosterRole
      : isValidVlyCoachNumberFormat(vlyNumber)
        ? "COACH"
        : "PLAYER";

  if (!isValidClubMemberNumberForRole(vlyNumber, rosterRole)) {
    throw new Error(
      rosterRole === "COACH"
        ? "Invalid vly_number for coach (e.g. VLYC12345)"
        : "Invalid vly_number for player (e.g. VLY12345)",
    );
  }

  const squadKeys =
    row.training_team_key
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean) ?? [];

  const name = row.name?.trim() ?? "";
  if (name.length < 2) {
    throw new Error("Full name is required");
  }

  const active = parseBool(row.active, true);
  if (rosterRole === "PLAYER" && squadKeys.length === 0 && active) {
    throw new Error("Team is required for active players");
  }
  if (rosterRole === "PLAYER" && squadKeys.length > 1) {
    throw new Error("Players can only belong to one squad");
  }

  for (const key of squadKeys) {
    if (!(await isTrainingSquadKey(key))) {
      throw new Error("Invalid training_team_key");
    }
  }

  const coachPaymentRaw = parseOptional(row.coach_payment_type)?.toUpperCase();
  const coachPaymentType =
    rosterRole === "COACH"
      ? coachPaymentRaw === "VOLUNTEER"
        ? "VOLUNTEER"
        : "PAID"
      : null;

  const playerPaymentType = normalizePlayerPaymentType(
    parseOptional(row.player_payment_type)?.toUpperCase(),
  );

  return {
    rowNumber,
    fingerprint: rosterFingerprint(vlyNumber),
    vlyNumber,
    name,
    rosterRole,
    squadKeys,
    coachPaymentType,
    playerPaymentType,
    active,
  };
}

async function overrideRoster(
  rows: Record<string, string>[],
  fileName: string | null,
  options: BulkImportOptions = {},
): Promise<BulkImportResult> {
  const result = emptyResult(fileName);
  const desired: ParsedRosterRow[] = [];
  const seenInFile = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const rowNumber = index + 2;
    if (rowIsEmpty(row)) continue;

    result.scanned += 1;
    try {
      const parsed = await parseRosterRow(row, rowNumber);
      if (seenInFile.has(parsed.fingerprint)) {
        throw new Error(`Duplicate vly_number ${parsed.vlyNumber} in sheet`);
      }
      seenInFile.add(parsed.fingerprint);
      desired.push(parsed);
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  if (result.failed > 0) {
    return result;
  }

  if (desired.length === 0) {
    result.failed = 1;
    result.errors.push({
      row: 0,
      message: "Sheet has no data rows — upload cancelled to avoid wiping the list.",
    });
    return result;
  }

  const existing = await prisma.clubMember.findMany({
    select: {
      id: true,
      vlyNumber: true,
      userId: true,
      name: true,
      rosterRole: true,
      trainingTeamKey: true,
      coachPaymentType: true,
      playerPaymentType: true,
      active: true,
      coachSquads: { select: { trainingTeamKey: true } },
    },
  });

  const existingByFingerprint = new Map(
    existing
      .filter((member) => member.vlyNumber?.trim())
      .map((member) => [rosterFingerprint(member.vlyNumber!), member]),
  );

  const desiredFingerprints = new Set(desired.map((row) => row.fingerprint));
  const plannedRemovals = planRosterRemovals(existing, desiredFingerprints);

  if (plannedRemovals.length > 0 && !options.confirmDestructive) {
    return {
      ...result,
      needsConfirmation: true,
      plannedRemovals: plannedRemovals.length,
      failed: 1,
      errors: [
        {
          row: 0,
          message: `This override would remove ${plannedRemovals.length} roster ${plannedRemovals.length === 1 ? "entry" : "entries"}. Confirm to continue. Members without a VLY number are never auto-removed.`,
        },
      ],
    };
  }

  const squadKeysToSync = new Set<string>();

  for (const row of desired) {
    const current = existingByFingerprint.get(row.fingerprint);
    for (const key of row.squadKeys) squadKeysToSync.add(key);

    if (!current) {
      const clubMember = await prisma.clubMember.create({
        data: {
          vlyNumber: row.vlyNumber,
          name: row.name,
          trainingTeamKey: row.squadKeys[0] ?? null,
          rosterRole: row.rosterRole,
          coachPaymentType: row.coachPaymentType,
          playerPaymentType:
            row.rosterRole === "PLAYER" ? row.playerPaymentType : "MEMBERSHIP",
          active: row.active,
        },
      });
      if (row.rosterRole === "COACH") {
        await setClubMemberCoachSquads(clubMember.id, row.squadKeys);
      }
      result.created += 1;
      continue;
    }

    const currentSquadKeys =
      current.rosterRole === "COACH"
        ? current.coachSquads.map((squad) => squad.trainingTeamKey).sort()
        : current.trainingTeamKey
          ? [current.trainingTeamKey]
          : [];
    const nextSquadKeys = [...row.squadKeys].sort();
    const changed =
      current.name !== row.name ||
      current.rosterRole !== row.rosterRole ||
      current.active !== row.active ||
      (current.coachPaymentType ?? null) !== row.coachPaymentType ||
      normalizePlayerPaymentType(current.playerPaymentType) !==
        row.playerPaymentType ||
      currentSquadKeys.join(",") !== nextSquadKeys.join(",");

    if (changed) {
      for (const key of currentSquadKeys) squadKeysToSync.add(key);
      await prisma.clubMember.update({
        where: { id: current.id },
        data: {
          name: row.name,
          trainingTeamKey: row.squadKeys[0] ?? null,
          rosterRole: row.rosterRole,
          coachPaymentType: row.coachPaymentType,
          playerPaymentType:
            row.rosterRole === "PLAYER" ? row.playerPaymentType : "MEMBERSHIP",
          active: row.active,
        },
      });
      if (row.rosterRole === "COACH") {
        await setClubMemberCoachSquads(current.id, row.squadKeys);
      } else {
        await setClubMemberCoachSquads(current.id, []);
      }
      result.updated += 1;
    }
  }

  const removalIds = new Set(plannedRemovals.map((member) => member.id));
  for (const member of existing) {
    if (!removalIds.has(member.id)) continue;

    if (member.trainingTeamKey) squadKeysToSync.add(member.trainingTeamKey);
    for (const squad of member.coachSquads) {
      squadKeysToSync.add(squad.trainingTeamKey);
    }

    if (member.userId) {
      await setClubMemberCoachSquads(member.id, []);
      await prisma.clubMember.update({
        where: { id: member.id },
        data: {
          active: false,
          trainingTeamKey: null,
        },
      });
    } else {
      await setClubMemberCoachSquads(member.id, []);
      await prisma.clubMember.delete({ where: { id: member.id } });
    }
    result.removed += 1;
  }

  for (const squadKey of squadKeysToSync) {
    if (await isTrainingSquadKey(squadKey)) {
      await syncClubTeamsForSquadKey(squadKey);
    }
  }

  return result;
}

async function overrideTrainingSessions(
  rows: Record<string, string>[],
  category: SessionCategory,
  fileName: string | null,
): Promise<BulkImportResult> {
  const result = emptyResult(fileName);
  type Desired = { rowNumber: number; fingerprint: string; data: TrainingSessionData };
  const desired: Desired[] = [];
  const seenInFile = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const rowNumber = index + 2;
    if (rowIsEmpty(row)) continue;
    result.scanned += 1;

    try {
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
      if (seenInFile.has(fingerprint)) {
        throw new Error("Duplicate session row in sheet");
      }
      seenInFile.add(fingerprint);
      desired.push({ rowNumber, fingerprint, data: sessionData });
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  if (result.failed > 0) return result;

  if (desired.length === 0) {
    result.failed = 1;
    result.errors.push({
      row: 0,
      message: "Sheet has no data rows — upload cancelled to avoid wiping the list.",
    });
    return result;
  }

  const existing = await prisma.trainingSession.findMany({
    where: { category },
  });
  const existingByFingerprint = new Map(
    existing.map((session) => [
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
      session,
    ]),
  );

  const desiredFingerprints = new Set(desired.map((row) => row.fingerprint));

  for (const row of desired) {
    if (existingByFingerprint.has(row.fingerprint)) continue;
    const session = await prisma.trainingSession.create({
      data: { ...row.data, category },
    });
    await syncTrainingSessionEvents(session);
    result.created += 1;
  }

  for (const session of existing) {
    const fingerprint = trainingSessionFingerprint(category, {
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
    });
    if (desiredFingerprints.has(fingerprint)) continue;
    await deleteTrainingSessionCascade(session.id);
    result.removed += 1;
  }

  return result;
}

async function overrideMatches(
  rows: Record<string, string>[],
  fileName: string | null,
): Promise<BulkImportResult> {
  const result = emptyResult(fileName);
  type Desired = { fingerprint: string; data: ParsedTeamMatch };
  const desired: Desired[] = [];
  const seenInFile = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const rowNumber = index + 2;
    if (rowIsEmpty(row)) continue;
    result.scanned += 1;

    try {
      const parsed = teamMatchSchema.safeParse({
        trainingTeamKey: row.training_team_key?.trim(),
        opponentName: row.opponent_name?.trim(),
        venue: row.venue?.trim().toUpperCase(),
        location: row.location?.trim(),
        warmUpTime: row.warm_up_time?.trim()
          ? parseCsvDateTime(row.warm_up_time)
          : "",
        matchStart: row.match_start?.trim()
          ? parseCsvDateTime(row.match_start)
          : "",
        notes: parseOptional(row.notes),
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
      }
      if (!(await isTrainingSquadKey(parsed.data.trainingTeamKey))) {
        throw new Error("Invalid training_team_key");
      }
      const fingerprint = matchFingerprint(parsed.data);
      if (seenInFile.has(fingerprint)) {
        throw new Error("Duplicate match row in sheet");
      }
      seenInFile.add(fingerprint);
      desired.push({ fingerprint, data: parsed.data });
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  if (result.failed > 0) return result;

  if (desired.length === 0) {
    result.failed = 1;
    result.errors.push({
      row: 0,
      message: "Sheet has no data rows — upload cancelled to avoid wiping the list.",
    });
    return result;
  }

  const existing = await prisma.teamMatch.findMany();
  const existingByFingerprint = new Map(
    existing.map((match) => [
      matchFingerprint({
        trainingTeamKey: match.trainingTeamKey,
        opponentName: match.opponentName,
        venue: match.venue as ParsedTeamMatch["venue"],
        location: match.location,
        warmUpTime: match.warmUpTime.toISOString(),
        matchStart: match.matchStart.toISOString(),
        notes: match.notes ?? undefined,
      }),
      match,
    ]),
  );
  const desiredFingerprints = new Set(desired.map((row) => row.fingerprint));

  for (const row of desired) {
    if (existingByFingerprint.has(row.fingerprint)) continue;
    await prisma.teamMatch.create({
      data: {
        trainingTeamKey: row.data.trainingTeamKey,
        opponentName: row.data.opponentName.trim(),
        venue: row.data.venue,
        location: row.data.location.trim(),
        warmUpTime: new Date(row.data.warmUpTime),
        matchStart: new Date(row.data.matchStart),
        notes: row.data.notes ?? null,
      },
    });
    result.created += 1;
  }

  for (const [fingerprint, match] of existingByFingerprint) {
    if (desiredFingerprints.has(fingerprint)) continue;
    await prisma.teamMatch.delete({ where: { id: match.id } });
    result.removed += 1;
  }

  return result;
}

async function overrideEvents(
  rows: Record<string, string>[],
  fileName: string | null,
): Promise<BulkImportResult> {
  const result = emptyResult(fileName);
  type Desired = { fingerprint: string; data: ParsedEvent };
  const desired: Desired[] = [];
  const seenInFile = new Set<string>();

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    const rowNumber = index + 2;
    if (rowIsEmpty(row)) continue;
    result.scanned += 1;

    try {
      const parsed = eventSchema.safeParse({
        title: row.title?.trim(),
        type: row.type?.trim().toUpperCase(),
        startDate: row.start_date?.trim()
          ? parseCsvDateTime(row.start_date)
          : "",
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
      if (seenInFile.has(fingerprint)) {
        throw new Error("Duplicate event row in sheet");
      }
      seenInFile.add(fingerprint);
      desired.push({ fingerprint, data: parsed.data });
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message : "Import failed",
      });
    }
  }

  if (result.failed > 0) return result;

  if (desired.length === 0) {
    result.failed = 1;
    result.errors.push({
      row: 0,
      message: "Sheet has no data rows — upload cancelled to avoid wiping the list.",
    });
    return result;
  }

  const existing = await prisma.event.findMany({
    where: { trainingSessionId: null },
  });
  const existingByFingerprint = new Map(
    existing.map((event) => [
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
      event,
    ]),
  );
  const desiredFingerprints = new Set(desired.map((row) => row.fingerprint));

  for (const row of desired) {
    if (existingByFingerprint.has(row.fingerprint)) continue;
    await prisma.event.create({ data: toManualEventData(row.data) });
    result.created += 1;
  }

  for (const [fingerprint, event] of existingByFingerprint) {
    if (desiredFingerprints.has(fingerprint)) continue;
    await prisma.eventReminder.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
    result.removed += 1;
  }

  return result;
}

export async function runBulkImport(
  type: BulkImportType,
  rows: Record<string, string>[],
  fileName: string | null,
  options: BulkImportOptions = {},
): Promise<BulkImportResult> {
  if (rows.length === 0) {
    return emptyResult(fileName);
  }

  if (type === "roster") {
    return overrideRoster(rows, fileName, options);
  }
  if (type === "weekly-training") {
    return overrideTrainingSessions(rows, SESSION_CATEGORIES.WEEKLY, fileName);
  }
  if (type === "fun-sessions") {
    return overrideTrainingSessions(rows, SESSION_CATEGORIES.FUN, fileName);
  }
  if (type === "matches") {
    return overrideMatches(rows, fileName);
  }
  return overrideEvents(rows, fileName);
}
