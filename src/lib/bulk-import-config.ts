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
      fileName: "jackals-roster.xlsx",
      headers: [
        "vly_number",
        "name",
        "training_team_key",
        "roster_role",
        "player_payment_type",
        "coach_payment_type",
        "active",
      ],
      instructions:
        "Download the current roster, edit the sheet (add or delete rows), then upload. The sheet becomes the full roster — rows removed from Excel are removed from the club (unlinked entries deleted; linked accounts deactivated).",
    },
    "weekly-training": {
      fileName: "jackals-weekly-training.xlsx",
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
        "Download current weekly training, edit the sheet (add or delete rows), then upload. The sheet replaces the full weekly training list.",
    },
    "fun-sessions": {
      fileName: "jackals-fun-sessions.xlsx",
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
        "Download current fun sessions, edit the sheet (add or delete rows), then upload. The sheet replaces the full fun-session list.",
    },
    matches: {
      fileName: "jackals-matches.xlsx",
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
        "Download current matches, edit the sheet (add or delete rows), then upload. The sheet replaces the full match list.",
    },
    events: {
      fileName: "jackals-events.xlsx",
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
        "Download current calendar events, edit the sheet (add or delete rows), then upload. The sheet replaces tournaments, clinics, and socials (training-linked events are left alone).",
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
