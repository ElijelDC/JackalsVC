import { formatMembershipSubscriptionLabel } from "@/lib/membership-config";

export const MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "PENDING_PAYMENT",
  "COACH",
  "ARREARS",
] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/** Statuses admins can assign when granting or editing memberships. */
export const ADMIN_MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "CANCELLED",
  "ARREARS",
] as const;

export type AdminMembershipStatus = (typeof ADMIN_MEMBERSHIP_STATUSES)[number];

const STATUS_LABELS: Record<MembershipStatus, string> = {
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  PENDING_PAYMENT: "Awaiting payment",
  COACH: "Coach",
  ARREARS: "Arrears",
};

export function formatMembershipStatusLabel(status: string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as MembershipStatus];
  }
  return status;
}

export function isAdminMembershipStatus(
  status: string,
): status is AdminMembershipStatus {
  return (ADMIN_MEMBERSHIP_STATUSES as readonly string[]).includes(status);
}

export function isCoachMembershipStatus(status: string): boolean {
  return status === "COACH";
}

export function formatMembershipSubscriptionOrCoachLabel(
  planName: string,
  paymentSchedule: string,
  status: string,
): string {
  if (isCoachMembershipStatus(status)) {
    return "Coach";
  }

  return formatMembershipSubscriptionLabel(planName, paymentSchedule);
}

export function membershipStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "border-green-500/30 bg-green-500/10 text-green-400";
    case "COACH":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "EXPIRED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "ARREARS":
      return "border-red-500/30 bg-red-500/10 text-red-300";
    case "CANCELLED":
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
    case "PENDING_PAYMENT":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    default:
      return "border-zinc-500/30 bg-zinc-500/10 text-zinc-400";
  }
}
