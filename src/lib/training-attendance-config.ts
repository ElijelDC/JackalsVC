export const TRAINING_ATTENDANCE_STATUSES = [
  "ATTENDING",
  "NOT_ATTENDING",
  "UNANSWERED",
] as const;

export type TrainingAttendanceStatus =
  (typeof TRAINING_ATTENDANCE_STATUSES)[number];

export type TrainingAttendanceResponseStatus = "ATTENDING" | "NOT_ATTENDING";

export const TRAINING_ATTENDANCE_LABELS: Record<
  TrainingAttendanceStatus,
  string
> = {
  ATTENDING: "Attending",
  NOT_ATTENDING: "Can't attend",
  UNANSWERED: "Unanswered",
};

export const TRAINING_ATTENDANCE_SHORT_LABELS: Record<
  TrainingAttendanceStatus,
  string
> = {
  ATTENDING: "Attend",
  NOT_ATTENDING: "Can't attend",
  UNANSWERED: "Unanswered",
};

export const TRAINING_ATTENDANCE_BADGE_STYLES: Record<
  TrainingAttendanceStatus,
  string
> = {
  ATTENDING: "border-green-500/40 bg-green-500/15 text-green-300",
  NOT_ATTENDING:
    "border-rose-400/50 bg-rose-500/20 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
  UNANSWERED: "border-amber-500/40 bg-amber-500/15 text-amber-200",
};

/** Shown on schedule rows that still need a player response */
export const TRAINING_NEEDS_RESPONSE_LABEL = "Response needed";

/** Players can start responding this many days before a session */
export const TRAINING_RESPONSE_OPENS_DAYS = 14;

/** Players are prompted to respond within this many days of a session */
export const TRAINING_RESPONSE_WINDOW_DAYS = 7;

export function getResponseWindowEndDate(
  fromDate: Date = new Date(),
  daysAhead: number = TRAINING_RESPONSE_OPENS_DAYS,
): Date {
  const through = new Date(fromDate);
  through.setDate(through.getDate() + daysAhead);
  return through;
}

export function getDaysUntilTrainingSession(
  sessionDate: Date,
  now: Date = new Date(),
): number {
  return Math.ceil(
    (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function canRespondToTrainingSession(
  sessionDate: Date,
  now: Date = new Date(),
): boolean {
  const daysUntil = getDaysUntilTrainingSession(sessionDate, now);
  return daysUntil >= 0 && daysUntil <= TRAINING_RESPONSE_OPENS_DAYS;
}

export function getTrainingResponseOpensOn(sessionDate: Date): Date {
  const opensOn = new Date(sessionDate);
  opensOn.setHours(0, 0, 0, 0);
  opensOn.setDate(opensOn.getDate() - TRAINING_RESPONSE_OPENS_DAYS);
  return opensOn;
}

export function isWithinTrainingResponseWindow(
  sessionDate: Date,
  now: Date = new Date(),
): boolean {
  const daysUntil = getDaysUntilTrainingSession(sessionDate, now);
  return daysUntil >= 0 && daysUntil <= TRAINING_RESPONSE_WINDOW_DAYS;
}

export function sessionNeedsPlayerResponse(
  userStatus: TrainingAttendanceStatus,
  sessionDate: Date,
  now: Date = new Date(),
): boolean {
  return (
    userStatus === "UNANSWERED" &&
    canRespondToTrainingSession(sessionDate, now) &&
    isWithinTrainingResponseWindow(sessionDate, now)
  );
}

export type DashboardResponseDisplay = {
  label: string;
  badgeClassName: string;
  needsUrgentResponse: boolean;
};

/** Dashboard badge copy — urgent only inside the 7-day window. */
export function getDashboardResponseDisplay(
  userStatus: TrainingAttendanceStatus,
  eventDate: Date,
  now: Date = new Date(),
): DashboardResponseDisplay {
  if (userStatus === "ATTENDING") {
    return {
      label: "Attending",
      badgeClassName: "border-green-500/30 bg-green-500/10 text-green-400",
      needsUrgentResponse: false,
    };
  }

  if (userStatus === "NOT_ATTENDING") {
    return {
      label: "Declined",
      badgeClassName: "border-rose-500/30 bg-rose-500/10 text-rose-300",
      needsUrgentResponse: false,
    };
  }

  if (!isWithinTrainingResponseWindow(eventDate, now)) {
    return {
      label: "Unanswered",
      badgeClassName: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
      needsUrgentResponse: false,
    };
  }

  return {
    label: TRAINING_NEEDS_RESPONSE_LABEL,
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    needsUrgentResponse: true,
  };
}

export function itemNeedsUrgentResponse(
  userStatus: TrainingAttendanceStatus,
  eventDate: Date,
  now: Date = new Date(),
): boolean {
  return getDashboardResponseDisplay(userStatus, eventDate, now).needsUrgentResponse;
}

export function normalizeSignupStatus(
  status: string | null | undefined,
): TrainingAttendanceStatus {
  if (status === "ATTENDING" || status === "CONFIRMED") return "ATTENDING";
  if (status === "NOT_ATTENDING") return "NOT_ATTENDING";
  return "UNANSWERED";
}

export type TrainingRosterMember = {
  userId: string;
  name: string;
  status: TrainingAttendanceStatus;
  isCurrentUser: boolean;
};

export type TrainingSessionDetailData = {
  event: {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string | null;
    location: string | null;
    coach: string | null;
  };
  team: {
    key: string;
    name: string;
    dayLabel: string;
  };
  userStatus: TrainingAttendanceStatus;
  roster: {
    attending: TrainingRosterMember[];
    notAttending: TrainingRosterMember[];
    unanswered: TrainingRosterMember[];
  };
  counts: {
    attending: number;
    notAttending: number;
    unanswered: number;
    total: number;
  };
};
