import {
  isStudentMembershipPlanName,
  MEMBERSHIP_PLAN_STUDENT_NAME,
} from "@/lib/membership-config";

export const STUDENT_ID_REVIEW_STATUSES = [
  "AWAITING_PROOF",
  "PENDING",
  "APPROVED",
  "DECLINED",
] as const;

export type StudentIdReviewStatus = (typeof STUDENT_ID_REVIEW_STATUSES)[number];

export const STUDENT_ID_REVIEW_STATUS_LABELS: Record<
  StudentIdReviewStatus,
  string
> = {
  AWAITING_PROOF: "No ID yet",
  PENDING: "Awaiting review",
  APPROVED: "Approved",
  DECLINED: "Declined",
};

export type StudentIdReviewRecord = {
  id: string;
  planName: string;
  studentIdProofUrl: string | null;
  studentIdProofSubmittedAt: string | null;
  studentIdReviewStatus: StudentIdReviewStatus;
  studentIdReviewNote: string | null;
  user: { id: string; name: string; email: string };
};

/** Active Student/U18 memberships still need an approved ID on file. */
export function studentMembershipNeedsIdProof(input: {
  planName: string;
  studentIdReviewStatus: string | null;
}): boolean {
  return (
    isStudentMembershipPlanName(input.planName) &&
    input.studentIdReviewStatus !== "APPROVED"
  );
}

/**
 * Normalize legacy null statuses (pre-feature checkouts) for UI.
 * Members with a photo but no status are treated as pending review.
 */
export function resolveStudentIdReviewStatus(input: {
  planName: string;
  studentIdReviewStatus: string | null;
  studentIdProofUrl: string | null;
}): StudentIdReviewStatus | null {
  if (!isStudentMembershipPlanName(input.planName)) return null;

  const status = input.studentIdReviewStatus;
  if (status === "APPROVED" || status === "DECLINED" || status === "PENDING") {
    return status;
  }
  if (status === "AWAITING_PROOF") return "AWAITING_PROOF";

  // Legacy / checkout-bypass: null status before the ID feature existed.
  if (input.studentIdProofUrl?.startsWith("/")) return "PENDING";
  return "AWAITING_PROOF";
}

export function isStudentIdAwaitingAdminReview(input: {
  studentIdReviewStatus: string | null;
  studentIdProofUrl: string | null;
}): boolean {
  return (
    input.studentIdReviewStatus === "PENDING" &&
    Boolean(input.studentIdProofUrl?.startsWith("/"))
  );
}

export { MEMBERSHIP_PLAN_STUDENT_NAME };
