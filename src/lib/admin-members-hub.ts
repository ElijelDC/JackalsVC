import type { CoachPaymentType } from "@/lib/coach-payment-type";
import type { PlayerPaymentType } from "@/lib/player-payment-type";

export type AdminMembersSquadFilter = "ALL" | "d2m" | "d3w" | "d3m";

export const ADMIN_MEMBERS_SQUAD_FILTERS: {
  id: AdminMembersSquadFilter;
  label: string;
  keys: string[] | null;
}[] = [
  { id: "ALL", label: "All", keys: null },
  { id: "d2m", label: "d2m", keys: ["DIV2_MENS"] },
  { id: "d3w", label: "d3w", keys: ["DIV3_WOMENS"] },
  { id: "d3m", label: "d3m", keys: ["DIV3_MENS", "DIV4_MENS", "DIVISION_3_MENS"] },
];

export function squadShortLabel(trainingTeamKey: string | null | undefined) {
  if (!trainingTeamKey) return null;
  if (trainingTeamKey === "DIV2_MENS") return "d2m";
  if (trainingTeamKey === "DIV3_WOMENS") return "d3w";
  if (
    trainingTeamKey === "DIV3_MENS" ||
    trainingTeamKey === "DIV4_MENS" ||
    trainingTeamKey === "DIVISION_3_MENS"
  ) {
    return "d3m";
  }
  return trainingTeamKey;
}

export function matchesAdminMembersSquadFilter(
  trainingTeamKeys: string[],
  squad: AdminMembersSquadFilter,
) {
  const filter = ADMIN_MEMBERS_SQUAD_FILTERS.find((item) => item.id === squad);
  if (!filter?.keys) return true;
  return trainingTeamKeys.some((key) => filter.keys!.includes(key));
}

export type AdminMembersClubMember = {
  id: string;
  vlyNumber: string | null;
  name: string;
  active: boolean;
  rosterRole: string;
  coachPaymentType: CoachPaymentType | null;
  playerPaymentType: PlayerPaymentType;
  trainingTeamKey: string | null;
  trainingTeamKeys: string[];
  coachSquadPriorities: Record<string, number>;
  profileImageUrl: string | null;
  vlyMembershipPhotoUrl: string | null;
  userId: string | null;
  user: { id: string; email: string } | null;
};

export type AdminMembersUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AdminMembersMembershipPayment = {
  status: string;
  dueDate: string | null;
  amount: number;
  installmentNumber: number | null;
};

export type AdminMembersMembership = {
  id: string;
  status: string;
  paymentSchedule: string;
  paymentOverdueOverride: boolean;
  paymentOverdueOverrideNote: string | null;
  paymentOverdueOverrideUntil: string | null;
  paymentDeferralExcuse: string | null;
  paymentDeferralDueDate: string | null;
  paymentDeferralRequestedAt: string | null;
  startDate: string;
  endDate: string;
  userId: string;
  plan: { id: string; name: string; price: number };
  payments: AdminMembersMembershipPayment[];
};

export type AdminMembersPlan = {
  id: string;
  name: string;
  price: number;
};

export type AdminMembersTrainingTeam = {
  key: string;
  name: string;
  dayLabel?: string;
};

export type AdminPersonRow = {
  id: string;
  kind: "roster" | "account_only";
  name: string;
  email: string | null;
  clubMember: AdminMembersClubMember | null;
  user: AdminMembersUser | null;
  memberships: AdminMembersMembership[];
  currentMembership: AdminMembersMembership | null;
};

export type AdminMembersFocus = "roster" | "account" | "subscription";

export function parseAdminMembersFocus(
  value: string | null | undefined,
): AdminMembersFocus {
  if (value === "roster" || value === "subscription") return value;
  return "account";
}
