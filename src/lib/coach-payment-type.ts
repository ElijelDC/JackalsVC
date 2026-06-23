export const COACH_PAYMENT_TYPES = ["PAID", "VOLUNTEER"] as const;

export type CoachPaymentType = (typeof COACH_PAYMENT_TYPES)[number];

export const COACH_PAYMENT_TYPE_LABELS: Record<CoachPaymentType, string> = {
  PAID: "Paid coach",
  VOLUNTEER: "Volunteer coach",
};

export function isCoachPaymentType(value: string | null | undefined): value is CoachPaymentType {
  return value === "PAID" || value === "VOLUNTEER";
}

export function defaultCoachPaymentTypeForRole(
  rosterRole: string,
): CoachPaymentType | null {
  return rosterRole === "COACH" ? "PAID" : null;
}

export function isPaidCoachMember(
  rosterRole: string,
  coachPaymentType: string | null | undefined,
): boolean {
  return rosterRole === "COACH" && (coachPaymentType ?? "PAID") === "PAID";
}
