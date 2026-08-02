export type TrialSessionRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  locationUrl: string | null;
  paymentUrl: string | null;
  reclubUsername: string | null;
  sessionFee: number | null;
  coachName: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TrialSessionSignupRecord = {
  id: string;
  displayName: string;
  email: string;
  status: TrialSessionSignupStatus;
  createdAt: string;
  reminderSent: boolean;
  paymentProofUrl: string | null;
};

export const TRIAL_SESSION_SIGNUP_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;

export type TrialSessionSignupStatus =
  (typeof TRIAL_SESSION_SIGNUP_STATUSES)[number];

export const TRIAL_SESSION_SIGNUP_STATUS_LABELS: Record<
  TrialSessionSignupStatus,
  string
> = {
  PENDING: "Awaiting approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function isTrialSessionSignupStatus(
  value: string,
): value is TrialSessionSignupStatus {
  return (TRIAL_SESSION_SIGNUP_STATUSES as readonly string[]).includes(value);
}

export function trialSessionRequiresPaymentProof(session: {
  paymentUrl: string | null;
  sessionFee: number | null;
}): boolean {
  return Boolean(session.paymentUrl || session.sessionFee != null);
}

/** Shown when a rejected applicant tries to resubmit with the same receipt. */
export const TRIAL_SESSION_NEW_RECEIPT_REQUIRED =
  "Upload a different payment receipt before submitting again.";

export type PublicTrialSession = Omit<TrialSessionRecord, "createdAt" | "updatedAt"> & {
  attendeeCount: number;
  attendees: Array<{ id: string; displayName: string }>;
};

export type AdminTrialSessionListItem = TrialSessionRecord & {
  signupCount: number;
  pendingApprovalCount: number;
};

export type TrialSessionReminderStats = {
  windowOpen: boolean;
  sent: number;
  pending: number;
};

export function trialSessionPublicPath(slug: string) {
  return `/trials/session/${slug}`;
}

export function normalizeTrialSessionEmail(email: string) {
  return email.trim().toLowerCase();
}

export function slugifyTrialSessionTitle(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "trial-session";
}
