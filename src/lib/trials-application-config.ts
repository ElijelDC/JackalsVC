export const TRIALS_APPLICATION_STATUSES = ["NEW", "REVIEWED", "DISMISSED"] as const;

export type TrialsApplicationStatus =
  (typeof TRIALS_APPLICATION_STATUSES)[number];

export const TRIALS_APPLICATION_STATUS_LABELS: Record<
  TrialsApplicationStatus,
  string
> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  DISMISSED: "Dismissed",
};

export function isTrialsApplicationStatus(
  value: string,
): value is TrialsApplicationStatus {
  return (TRIALS_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export type TrialsApplicationRecord = {
  id: string;
  tryingOutFor: string;
  fullName: string;
  age: number;
  contactEmail: string;
  contactNumber: string;
  yearsExperience: number;
  inlDivision: string;
  inlDivisionOther: string | null;
  inlTeamName: string | null;
  preferredPosition1: string;
  preferredPosition2: string;
  status: TrialsApplicationStatus;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeTrialsApplication(application: {
  id: string;
  tryingOutFor: string;
  fullName: string;
  age: number;
  contactEmail: string;
  contactNumber: string;
  yearsExperience: number;
  inlDivision: string;
  inlDivisionOther: string | null;
  inlTeamName: string | null;
  preferredPosition1: string;
  preferredPosition2: string;
  status: string;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TrialsApplicationRecord {
  return {
    id: application.id,
    tryingOutFor: application.tryingOutFor,
    fullName: application.fullName,
    age: application.age,
    contactEmail: application.contactEmail,
    contactNumber: application.contactNumber,
    yearsExperience: application.yearsExperience,
    inlDivision: application.inlDivision,
    inlDivisionOther: application.inlDivisionOther,
    inlTeamName: application.inlTeamName,
    preferredPosition1: application.preferredPosition1,
    preferredPosition2: application.preferredPosition2,
    status: isTrialsApplicationStatus(application.status)
      ? application.status
      : "NEW",
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    reviewedByUserId: application.reviewedByUserId,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
