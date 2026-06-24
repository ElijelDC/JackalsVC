import { buildCsvContent } from "@/lib/csv-utils";

export const BULK_IMPORT_TYPES = [
  "roster",
  "weekly-training",
  "fun-sessions",
  "matches",
  "events",
] as const;

export type BulkImportType = (typeof BULK_IMPORT_TYPES)[number];

type BulkImportDefinition = {
  fileName: string;
  headers: string[];
  instructions: string;
};

export const BULK_IMPORT_DEFINITIONS: Record<BulkImportType, BulkImportDefinition> =
  {
    roster: {
      fileName: "jackals-roster.csv",
      headers: [
        "vly_number",
        "name",
        "training_team_key",
        "roster_role",
        "coach_payment_type",
        "active",
      ],
      instructions:
        "Download the current roster, add new rows at the top, then upload. Use VLY12345 for players and VLYC12345 for coaches. Existing member numbers are skipped automatically.",
    },
    "weekly-training": {
      fileName: "jackals-weekly-training.csv",
      headers: [
        "title",
        "training_team_key",
        "recurring",
        "day_of_week",
        "recurrence_weeks",
        "recurring_from",
        "recurring_to",
        "session_date",
        "start_time",
        "end_time",
        "location",
        "level",
        "coach",
        "attendance_url",
        "description",
      ],
      instructions:
        "Download current training sessions, add new rows at the top, then upload. Duplicate sessions are skipped automatically.",
    },
    "fun-sessions": {
      fileName: "jackals-fun-sessions.csv",
      headers: [
        "title",
        "recurring",
        "day_of_week",
        "recurrence_weeks",
        "recurring_from",
        "recurring_to",
        "session_date",
        "start_time",
        "end_time",
        "location",
        "level",
        "coach",
        "attendance_url",
        "payment_url",
        "reclub_username",
        "session_fee",
        "description",
      ],
      instructions:
        "Download current fun sessions, add new rows at the top, then upload. Duplicate sessions are skipped automatically.",
    },
    matches: {
      fileName: "jackals-matches.csv",
      headers: [
        "training_team_key",
        "opponent_name",
        "venue",
        "location",
        "warm_up_time",
        "match_start",
        "notes",
      ],
      instructions:
        "Download current matches, add new rows at the top, then upload. Duplicate matches are skipped automatically.",
    },
    events: {
      fileName: "jackals-events.csv",
      headers: [
        "title",
        "type",
        "start_date",
        "end_date",
        "location",
        "description",
        "attendance_url",
        "payment_url",
        "session_fee",
        "reclub_username",
      ],
      instructions:
        "Download current tournaments, clinics, and socials, add new rows at the top, then upload. Duplicate events are skipped automatically.",
    },
  };

/** @deprecated Use BULK_IMPORT_DEFINITIONS */
export const BULK_IMPORT_TEMPLATES = BULK_IMPORT_DEFINITIONS;

export function isBulkImportType(value: string): value is BulkImportType {
  return (BULK_IMPORT_TYPES as readonly string[]).includes(value);
}

export function getBulkImportTemplateMeta(type: BulkImportType) {
  return BULK_IMPORT_DEFINITIONS[type];
}

export function getEmptyBulkImportCsv(type: BulkImportType): string {
  const definition = BULK_IMPORT_DEFINITIONS[type];
  return buildCsvContent(definition.headers, []);
}
