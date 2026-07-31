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
  createdAt: string;
  reminderSent: boolean;
};

export type PublicTrialSession = Omit<TrialSessionRecord, "createdAt" | "updatedAt"> & {
  attendeeCount: number;
  attendees: Array<{ id: string; displayName: string }>;
};

export type AdminTrialSessionListItem = TrialSessionRecord & {
  signupCount: number;
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
