import { safeFormatDate } from "@/lib/csv-date-parse";
import { buildCsvContent } from "@/lib/csv-utils";
import {
  BULK_IMPORT_DEFINITIONS,
  type BulkImportType,
} from "@/lib/bulk-import-config";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";
import { DAYS_OF_WEEK } from "@/lib/utils";

function formatBoolForCsv(value: boolean): string {
  return value ? "yes" : "no";
}

function formatCsvDate(value: Date | null | undefined): string {
  return safeFormatDate(value, "yyyy-MM-dd");
}

function formatCsvDateTime(value: Date | null | undefined): string {
  return safeFormatDate(value, "yyyy-MM-dd'T'HH:mm");
}

async function exportRosterRows(): Promise<string[][]> {
  const members = await prisma.clubMember.findMany({
    orderBy: [{ trainingTeamKey: "asc" }, { vlyNumber: "asc" }],
  });

  return members.map((member) => [
    member.vlyNumber ?? "",
    member.name,
    member.trainingTeamKey ?? "",
    member.rosterRole,
    member.coachPaymentType ?? "",
    formatBoolForCsv(member.active),
  ]);
}

async function exportTrainingSessionRows(
  category: typeof SESSION_CATEGORIES.WEEKLY | typeof SESSION_CATEGORIES.FUN,
): Promise<string[][]> {
  const sessions = await prisma.trainingSession.findMany({
    where: { category },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  if (category === SESSION_CATEGORIES.WEEKLY) {
    return sessions.map((session) => [
      session.title,
      session.trainingTeamKey ?? "",
      formatBoolForCsv(session.recurring),
      DAYS_OF_WEEK[session.dayOfWeek] ?? String(session.dayOfWeek),
      String(session.recurrenceWeeks),
      formatCsvDate(session.recurringFrom),
      formatCsvDate(session.recurringTo),
      formatCsvDate(session.sessionDate),
      session.startTime,
      session.endTime,
      session.location,
      session.level,
      session.coach ?? "",
      session.attendanceUrl ?? "",
      session.description ?? "",
    ]);
  }

  return sessions.map((session) => [
    session.title,
    formatBoolForCsv(session.recurring),
    DAYS_OF_WEEK[session.dayOfWeek] ?? String(session.dayOfWeek),
    String(session.recurrenceWeeks),
    formatCsvDate(session.recurringFrom),
    formatCsvDate(session.recurringTo),
    formatCsvDate(session.sessionDate),
    session.startTime,
    session.endTime,
    session.location,
    session.level,
    session.coach ?? "",
    session.attendanceUrl ?? "",
    session.paymentUrl ?? "",
    session.reclubUsername ?? "",
    session.sessionFee != null ? String(session.sessionFee) : "",
    session.description ?? "",
  ]);
}

async function exportMatchRows(): Promise<string[][]> {
  const matches = await prisma.teamMatch.findMany({
    orderBy: { matchStart: "asc" },
  });

  return matches.map((match) => [
    match.trainingTeamKey,
    match.opponentName,
    match.venue,
    match.location,
    formatCsvDateTime(match.warmUpTime),
    formatCsvDateTime(match.matchStart),
    match.notes ?? "",
  ]);
}

async function exportEventRows(): Promise<string[][]> {
  const events = await prisma.event.findMany({
    where: { trainingSessionId: null },
    orderBy: { startDate: "asc" },
  });

  return events.map((event) => [
    event.title,
    event.type,
    formatCsvDateTime(event.startDate),
    formatCsvDateTime(event.endDate),
    event.location ?? "",
    event.description ?? "",
    event.attendanceUrl ?? "",
    event.paymentUrl ?? "",
    event.sessionFee != null ? String(event.sessionFee) : "",
    event.reclubUsername ?? "",
  ]);
}

export async function exportBulkImportCsv(type: BulkImportType): Promise<string> {
  const meta = BULK_IMPORT_DEFINITIONS[type];
  let rows: string[][] = [];

  switch (type) {
    case "roster":
      rows = await exportRosterRows();
      break;
    case "weekly-training":
      rows = await exportTrainingSessionRows(SESSION_CATEGORIES.WEEKLY);
      break;
    case "fun-sessions":
      rows = await exportTrainingSessionRows(SESSION_CATEGORIES.FUN);
      break;
    case "matches":
      rows = await exportMatchRows();
      break;
    case "events":
      rows = await exportEventRows();
      break;
  }

  return buildCsvContent(meta.headers, rows);
}
