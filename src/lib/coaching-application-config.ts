export const COACHING_APPLICATION_STATUSES = ["NEW", "REVIEWED", "DISMISSED"] as const;

export type CoachingApplicationStatus =
  (typeof COACHING_APPLICATION_STATUSES)[number];

export const COACHING_APPLICATION_STATUS_LABELS: Record<
  CoachingApplicationStatus,
  string
> = {
  NEW: "New",
  REVIEWED: "Reviewed",
  DISMISSED: "Dismissed",
};

export function isCoachingApplicationStatus(
  value: string,
): value is CoachingApplicationStatus {
  return (COACHING_APPLICATION_STATUSES as readonly string[]).includes(value);
}

export type CoachingApplicationRecord = {
  id: string;
  fullName: string;
  age: number;
  contactNumber: string;
  contactEmail: string;
  qualificationLevel: string;
  yearsExperience: number;
  canCommuteToBothVenues: string;
  whyInterested: string;
  status: CoachingApplicationStatus;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function serializeCoachingApplication(application: {
  id: string;
  fullName: string;
  age: number;
  contactNumber: string;
  contactEmail: string;
  qualificationLevel: string;
  yearsExperience: number;
  canCommuteToBothVenues: string;
  whyInterested: string;
  status: string;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CoachingApplicationRecord {
  return {
    id: application.id,
    fullName: application.fullName,
    age: application.age,
    contactNumber: application.contactNumber,
    contactEmail: application.contactEmail,
    qualificationLevel: application.qualificationLevel,
    yearsExperience: application.yearsExperience,
    canCommuteToBothVenues: application.canCommuteToBothVenues,
    whyInterested: application.whyInterested,
    status: isCoachingApplicationStatus(application.status)
      ? application.status
      : "NEW",
    reviewedAt: application.reviewedAt?.toISOString() ?? null,
    reviewedByUserId: application.reviewedByUserId,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
