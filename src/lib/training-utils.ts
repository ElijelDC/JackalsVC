import { DAYS_OF_WEEK } from "@/lib/utils";
import type { TrainingSessionCardData } from "@/types/training-session";

export const SESSION_CATEGORIES = {
  WEEKLY: "WEEKLY",
  FUN: "FUN",
} as const;

export type SessionCategory =
  (typeof SESSION_CATEGORIES)[keyof typeof SESSION_CATEGORIES];

export function calendarEventTypeForCategory(category: string) {
  return category === SESSION_CATEGORIES.FUN ? "FUN" : "TRAINING";
}

export function serializeTrainingSession<
  T extends {
    recurring: boolean;
    recurrenceWeeks: number;
    recurringFrom: Date | null;
    recurringTo: Date | null;
    sessionDate: Date | null;
  },
>(session: T) {
  return {
    ...session,
    recurring: session.recurring ?? true,
    recurrenceWeeks: session.recurrenceWeeks ?? 1,
    recurringFrom: session.recurringFrom?.toISOString() ?? null,
    recurringTo: session.recurringTo?.toISOString() ?? null,
    sessionDate: session.sessionDate?.toISOString() ?? null,
  };
}

export function formatRecurrenceLabel(
  session: {
    recurring: boolean;
    dayOfWeek: number;
    recurrenceWeeks: number;
    sessionDate: Date | null;
    recurringFrom?: Date | null;
    recurringTo?: Date | null;
  },
  options?: { includeDateRange?: boolean },
) {
  const includeDateRange = options?.includeDateRange ?? false;

  const fmt = (date: Date) =>
    date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (!session.recurring) {
    return session.sessionDate
      ? `One-off · ${fmt(session.sessionDate)}`
      : "One-off";
  }

  const day = DAYS_OF_WEEK[session.dayOfWeek];
  const interval =
    session.recurrenceWeeks === 1
      ? `Every ${day}`
      : session.recurrenceWeeks === 2
        ? `Every 2 weeks on ${day}`
        : session.recurrenceWeeks === 4
          ? `Every 4 weeks on ${day}`
          : `Every ${session.recurrenceWeeks} weeks on ${day}`;

  if (includeDateRange && session.recurringFrom && session.recurringTo) {
    return `${interval} · ${fmt(session.recurringFrom)} – ${fmt(session.recurringTo)}`;
  }

  return interval;
}

export function buildTrainingEventDescription(
  session: {
    level: string;
    coach?: string | null;
    description?: string | null;
  },
  overrides?: {
    coach?: string | null;
    description?: string | null;
  },
) {
  const coach =
    overrides?.coach !== undefined ? overrides.coach : session.coach;
  const description =
    overrides?.description !== undefined
      ? overrides.description
      : session.description;

  const parts = [session.level];
  if (coach) parts.push(`Coach: ${coach}`);
  if (description) parts.push(description);
  return parts.join(" · ");
}

export function toTrainingSessionData(data: {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description?: string;
  coach?: string;
  attendanceUrl?: string;
  paymentUrl?: string;
  reclubUsername?: string;
  sessionFee?: number;
  recurring: boolean;
  recurrenceWeeks: number;
  sessionDate?: string;
  recurringFrom?: string;
  recurringTo?: string;
  trainingTeamKey?: string;
}) {
  return {
    title: data.title,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    level: data.level,
    description: data.description || null,
    coach: data.coach || null,
    attendanceUrl: data.attendanceUrl || null,
    paymentUrl: data.paymentUrl || null,
    reclubUsername: data.reclubUsername || null,
    sessionFee: data.sessionFee ?? null,
    recurring: data.recurring,
    recurrenceWeeks: data.recurring ? data.recurrenceWeeks : 1,
    trainingTeamKey: data.trainingTeamKey || null,
    recurringFrom:
      data.recurring && data.recurringFrom
        ? new Date(data.recurringFrom)
        : null,
    recurringTo:
      data.recurring && data.recurringTo ? new Date(data.recurringTo) : null,
    sessionDate:
      !data.recurring && data.sessionDate ? new Date(data.sessionDate) : null,
  };
}

export function defaultRecurringFrom() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultRecurringTo(monthsAhead = 3) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  return date.toISOString().slice(0, 10);
}

export const SESSION_MANAGER_CONFIG = {
  WEEKLY: {
    category: SESSION_CATEGORIES.WEEKLY,
    apiBasePath: "/api/admin/training",
    adminPath: "/admin/training",
    publicPath: "/training",
    attendPath: "/training",
    sectionTitle: "Training schedule",
    sectionDescription:
      "One recurring session per squad. Assign players to a team on the members roster — they only see their own training dates.",
    emptyListMessage: "No training sessions yet.",
    deleteConfirm:
      "Delete this training session and its calendar entries?",
    addLabel: "Add session",
    bulkImportType: "weekly-training" as const,
  },
  FUN: {
    category: SESSION_CATEGORIES.FUN,
    apiBasePath: "/api/admin/fun-sessions",
    adminPath: "/admin/fun-sessions",
    publicPath: "/fun-sessions",
    attendPath: "/fun-sessions",
    sectionTitle: "Fun sessions schedule",
    sectionDescription:
      "Set up recurring fun sessions or one-off social play. Add payment and Reclub links — visible to everyone and synced to the calendar.",
    emptyListMessage: "No fun sessions yet.",
    deleteConfirm: "Delete this fun session and its calendar entries?",
    addLabel: "Add session",
    bulkImportType: "fun-sessions" as const,
  },
} as const;

export type SessionManagerConfig =
  (typeof SESSION_MANAGER_CONFIG)[keyof typeof SESSION_MANAGER_CONFIG];

export function groupSessionsByDay(sessions: TrainingSessionCardData[]) {
  const recurring = sessions.filter((s) => s.recurring);
  const oneOff = sessions
    .filter((s) => !s.recurring && s.sessionDate)
    .sort(
      (a, b) =>
        new Date(a.sessionDate!).getTime() - new Date(b.sessionDate!).getTime(),
    );

  const grouped = DAYS_OF_WEEK.map((day, index) => ({
    day,
    sessions: recurring.filter((s) => s.dayOfWeek === index),
  })).filter((group) => group.sessions.length > 0);

  return { grouped, oneOff };
}
