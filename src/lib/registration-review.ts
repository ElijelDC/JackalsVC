export const REGISTRATION_REVIEW_STATUSES = [
  "PENDING",
  "APPROVED",
  "DECLINED",
] as const;

export type RegistrationReviewStatus =
  (typeof REGISTRATION_REVIEW_STATUSES)[number];

export function isRegistrationReviewStatus(
  value: string | null | undefined,
): value is RegistrationReviewStatus {
  return (
    value != null &&
    REGISTRATION_REVIEW_STATUSES.includes(value as RegistrationReviewStatus)
  );
}

export function registrationIsApproved(
  status: string | null | undefined,
): boolean {
  return status === "APPROVED";
}

export function registrationIsPending(
  status: string | null | undefined,
): boolean {
  return status === "PENDING";
}

export const VLY_NOT_FOUND_MESSAGE =
  "This VLY number was not found on the club roster. Please contact an admin or coach.";

export const REGISTRATION_PENDING_MESSAGE =
  "Your VLY membership screenshot has been submitted. A club admin will review it before you can continue registration.";

export const REGISTRATION_DECLINED_MESSAGE =
  "Your registration was declined. Please upload a new VLY membership screenshot or contact an admin or coach.";

export const REGISTRATION_NOT_APPROVED_MESSAGE =
  "Your membership photo is still awaiting admin approval.";
