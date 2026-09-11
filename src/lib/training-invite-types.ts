export const TRAINING_INVITE_PRICING_TYPES = ["PAID", "FREE"] as const;
export type TrainingInvitePricingType =
  (typeof TRAINING_INVITE_PRICING_TYPES)[number];

export const TRAINING_INVITE_STATUSES = ["ACTIVE", "REVOKED"] as const;
export type TrainingInviteStatus = (typeof TRAINING_INVITE_STATUSES)[number];

export const TRAINING_INVITE_SIGNUP_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;
export type TrainingInviteSignupStatus =
  (typeof TRAINING_INVITE_SIGNUP_STATUSES)[number];

export const TRAINING_INVITE_SIGNUP_STATUS_LABELS: Record<
  TrainingInviteSignupStatus,
  string
> = {
  PENDING: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function isTrainingInvitePricingType(
  value: string,
): value is TrainingInvitePricingType {
  return (TRAINING_INVITE_PRICING_TYPES as readonly string[]).includes(value);
}

export function isTrainingInviteSignupStatus(
  value: string,
): value is TrainingInviteSignupStatus {
  return (TRAINING_INVITE_SIGNUP_STATUSES as readonly string[]).includes(value);
}

export function trainingInviteRequiresPaymentProof(invite: {
  pricingType: string;
  sessionFeeEur?: number | null;
  paymentUrl?: string | null;
}) {
  if (invite.pricingType === "PAID") return true;
  return Boolean(invite.paymentUrl || invite.sessionFeeEur != null);
}

export function trainingInvitePublicPath(token: string) {
  return `/training-invite/${token}`;
}

export function normalizeTrainingInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Shown when a rejected applicant tries to resubmit with the same receipt. */
export const TRAINING_INVITE_NEW_RECEIPT_REQUIRED =
  "Upload a different payment receipt before submitting again.";

export type TrainingInviteRecord = {
  id: string;
  token: string;
  eventId: string;
  pricingType: TrainingInvitePricingType;
  sessionFeeEur: number | null;
  paymentUrl: string | null;
  status: TrainingInviteStatus;
  createdAt: string;
  publicPath: string;
};

export type TrainingInviteSignupRecord = {
  id: string;
  inviteId: string;
  displayName: string;
  email: string;
  status: TrainingInviteSignupStatus;
  pricingType: TrainingInvitePricingType;
  createdAt: string;
  paymentProofUrl: string | null;
};

export type PublicTrainingInvite = {
  token: string;
  pricingType: TrainingInvitePricingType;
  sessionFeeEur: number | null;
  paymentUrl: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  teamName: string | null;
  coachName: string | null;
  active: boolean;
  registrationOpen: boolean;
  /** Squad members marked attending — guests never see other invitees. */
  squadAttendees: Array<{ id: string; displayName: string }>;
};

export type TrainingInviteGuestAttendee = {
  id: string;
  displayName: string;
  email: string;
  pricingType: TrainingInvitePricingType;
};
