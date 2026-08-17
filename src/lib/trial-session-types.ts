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

/** One-off session receipts are deleted after this many days. */
export const TRIAL_SESSION_PAYMENT_PROOF_RETENTION_DAYS = 14;

export function trialSessionPaymentProofExpiryCutoff(now: Date = new Date()) {
  return new Date(
    now.getTime() -
      TRIAL_SESSION_PAYMENT_PROOF_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
}

export function isTrialSessionPaymentProofExpired(
  createdAt: Date,
  now: Date = new Date(),
) {
  return createdAt.getTime() < trialSessionPaymentProofExpiryCutoff(now).getTime();
}

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

export function trialSessionEndsAt(session: {
  startDate: string | Date;
  endDate?: string | Date | null;
}) {
  return new Date(session.endDate ?? session.startDate);
}

export function isTrialSessionInPast(
  session: { startDate: string | Date; endDate?: string | Date | null },
  now: Date = new Date(),
) {
  return trialSessionEndsAt(session) < now;
}

/** Registration stays open only before the session starts. */
export function isTrialSessionRegistrationOpen(
  session: {
    startDate: string | Date;
    endDate?: string | Date | null;
    active?: boolean;
  },
  now: Date = new Date(),
) {
  if (session.active === false) return false;
  if (isTrialSessionInPast(session, now)) return false;
  return new Date(session.startDate) > now;
}

/** Prefer the upcoming/current session; callers should pass startDate desc.
 *  Public registration pages use pickLiveTrialSession — past slugs 404 unless
 *  a new live session reuses the slug.
 */
export function pickLiveTrialSession<
  T extends { startDate: string | Date; endDate?: string | Date | null },
>(sessions: T[], now: Date = new Date()): T | null {
  return sessions.find((session) => !isTrialSessionInPast(session, now)) ?? null;
}

export function pickPublicTrialSession<
  T extends { startDate: string | Date; endDate?: string | Date | null },
>(sessions: T[], now: Date = new Date()): T | null {
  return pickLiveTrialSession(sessions, now) ?? sessions[0] ?? null;
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
