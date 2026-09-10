export const PLAYER_PAYMENT_TYPES = ["MEMBERSHIP", "PAYG"] as const;

export type PlayerPaymentType = (typeof PLAYER_PAYMENT_TYPES)[number];

export const PLAYER_PAYMENT_TYPE_LABELS: Record<PlayerPaymentType, string> = {
  MEMBERSHIP: "Membership",
  PAYG: "Pay Per Training",
};

export function isPlayerPaymentType(
  value: string | null | undefined,
): value is PlayerPaymentType {
  return value === "MEMBERSHIP" || value === "PAYG";
}

export function normalizePlayerPaymentType(
  value: string | null | undefined,
): PlayerPaymentType {
  return value === "PAYG" ? "PAYG" : "MEMBERSHIP";
}

export function isPaygPlayer(
  rosterRole: string,
  playerPaymentType: string | null | undefined,
): boolean {
  return (
    rosterRole === "PLAYER" &&
    normalizePlayerPaymentType(playerPaymentType) === "PAYG"
  );
}

export const TRAINING_PAYG_ATTENDANCE_STATUSES = [
  "AWAITING_PROOF",
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type TrainingPaygAttendanceStatus =
  (typeof TRAINING_PAYG_ATTENDANCE_STATUSES)[number];

export const TRAINING_PAYG_ATTENDANCE_STATUS_LABELS: Record<
  TrainingPaygAttendanceStatus,
  string
> = {
  AWAITING_PROOF: "Awaiting receipt",
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function isTrainingPaygAttendanceStatus(
  value: string,
): value is TrainingPaygAttendanceStatus {
  return (TRAINING_PAYG_ATTENDANCE_STATUSES as readonly string[]).includes(
    value,
  );
}

export const TRAINING_PAYG_AI_DECISIONS = [
  "MATCH",
  "MISMATCH",
  "UNSURE",
] as const;

export type TrainingPaygAiDecision =
  (typeof TRAINING_PAYG_AI_DECISIONS)[number];

export const TRAINING_PAYG_SETTINGS_ID = "default";

export type TrainingPaygSettingsRecord = {
  id: string;
  sessionFeeEur: number;
  paymentUrl: string;
  active: boolean;
  updatedAt: string;
};

export type TrainingPaygAttendanceRecord = {
  id: string;
  clubMemberId: string;
  userId: string;
  eventId: string;
  amountDue: number;
  paymentReference: string;
  status: TrainingPaygAttendanceStatus;
  proofScreenshotUrl: string | null;
  aiDecision: TrainingPaygAiDecision | null;
  aiRawAmount: number | null;
  aiNotes: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  memberName?: string;
  memberEmail?: string | null;
  eventTitle?: string;
  eventStartDate?: string;
  trainingTeamKey?: string | null;
};

export function serializeTrainingPaygSettings(settings: {
  id: string;
  sessionFeeEur: number;
  paymentUrl: string;
  active: boolean;
  updatedAt: Date;
}): TrainingPaygSettingsRecord {
  return {
    id: settings.id,
    sessionFeeEur: settings.sessionFeeEur,
    paymentUrl: settings.paymentUrl,
    active: settings.active,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function serializeTrainingPaygAttendance(row: {
  id: string;
  clubMemberId: string;
  userId: string;
  eventId: string;
  amountDue: number;
  paymentReference: string;
  status: string;
  proofScreenshotUrl: string | null;
  aiDecision: string | null;
  aiRawAmount: number | null;
  aiNotes: string | null;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  clubMember?: {
    name: string;
    registrationContactEmail?: string | null;
    user?: { email?: string | null; name?: string | null } | null;
  } | null;
  event?: {
    title?: string;
    startDate?: Date;
    trainingTeamKey?: string | null;
  } | null;
}): TrainingPaygAttendanceRecord {
  const linkedUser = row.clubMember?.user;
  return {
    id: row.id,
    clubMemberId: row.clubMemberId,
    userId: row.userId,
    eventId: row.eventId,
    amountDue: row.amountDue,
    paymentReference: row.paymentReference,
    status: isTrainingPaygAttendanceStatus(row.status)
      ? row.status
      : "PENDING",
    proofScreenshotUrl: row.proofScreenshotUrl,
    aiDecision:
      row.aiDecision === "MATCH" ||
      row.aiDecision === "MISMATCH" ||
      row.aiDecision === "UNSURE"
        ? row.aiDecision
        : null,
    aiRawAmount: row.aiRawAmount,
    aiNotes: row.aiNotes,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    reviewedByUserId: row.reviewedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    memberName: row.clubMember?.name ?? linkedUser?.name ?? undefined,
    memberEmail:
      linkedUser?.email ??
      row.clubMember?.registrationContactEmail ??
      undefined,
    eventTitle: row.event?.title,
    eventStartDate: row.event?.startDate?.toISOString(),
    trainingTeamKey: row.event?.trainingTeamKey ?? null,
  };
}
