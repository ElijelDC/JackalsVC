import { prisma } from "@/lib/prisma";
import {
  assessInstallmentPaymentState,
  assessMembershipPaymentAccess,
  type MembershipPaymentAccess,
} from "@/lib/membership-overdue";
import { isPaygPlayer } from "@/lib/player-payment-type";
import { getTrainingPaygSettings } from "@/lib/training-payg-settings";

export type AttendanceBlockReason = "no_membership" | "overdue";

export type AttendanceAccessScope = "training" | "match";

export async function getCurrentMembership(userId: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      endDate: { gt: new Date() },
    },
    include: {
      plan: true,
      payments: {
        orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveMembership(userId: string) {
  return prisma.membership.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    include: { plan: true },
  });
}

/**
 * When instalments are past the grace window, flip ACTIVE → ARREARS so admin
 * and member UIs show the arrears status. Access is already blocked via
 * assessMembershipPaymentAccess while still ACTIVE and overdue.
 */
export async function syncMembershipArrearsStatus(membership: {
  id: string;
  status: string;
  paymentSchedule: string;
  payments: Array<{
    status: string;
    dueDate: Date | string | null;
    amount: number;
    installmentNumber: number | null;
  }>;
}) {
  if (membership.status !== "ACTIVE" && membership.status !== "ARREARS") {
    return membership.status;
  }

  const installment = assessInstallmentPaymentState({
    paymentSchedule: membership.paymentSchedule,
    payments: membership.payments,
  });

  if (membership.status === "ACTIVE" && installment.isOverdue) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "ARREARS" },
    });
    return "ARREARS";
  }

  if (membership.status === "ARREARS" && !installment.isOverdue && !installment.isPastDue) {
    await prisma.membership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE" },
    });
    return "ACTIVE";
  }

  return membership.status;
}

export async function getMembershipPaymentAccess(
  userId: string,
): Promise<{ membership: NonNullable<Awaited<ReturnType<typeof getCurrentMembership>>>; access: MembershipPaymentAccess } | null> {
  const membership = await getCurrentMembership(userId);
  if (!membership) return null;

  const syncedStatus = await syncMembershipArrearsStatus(membership);
  const membershipForAccess =
    syncedStatus === membership.status
      ? membership
      : { ...membership, status: syncedStatus };

  const access = assessMembershipPaymentAccess({
    membershipStatus: membershipForAccess.status,
    paymentSchedule: membershipForAccess.paymentSchedule,
    paymentOverdueOverride: membershipForAccess.paymentOverdueOverride,
    paymentOverdueOverrideUntil: membershipForAccess.paymentOverdueOverrideUntil,
    payments: membershipForAccess.payments,
  });

  return { membership: membershipForAccess, access };
}

/**
 * While roster flag is PAYG, weekly training always uses the pay-per-session flow.
 * Admins flip the flag to MEMBERSHIP when season membership starts — leftover
 * membership rows must not silently bypass the pay wall.
 */
async function resolvePaygTrainingState(userId: string): Promise<boolean> {
  const clubMember = await prisma.clubMember.findUnique({
    where: { userId },
    select: {
      active: true,
      rosterRole: true,
      playerPaymentType: true,
      trainingTeamKey: true,
    },
  });
  if (
    !clubMember?.active ||
    !isPaygPlayer(clubMember.rosterRole, clubMember.playerPaymentType) ||
    !clubMember.trainingTeamKey
  ) {
    return false;
  }

  const settings = await getTrainingPaygSettings();
  return settings.active;
}

export async function getAttendanceAccessInfo(
  user: {
    id: string;
    role?: string | null;
  },
  options?: { scope?: AttendanceAccessScope },
): Promise<{
  canAccess: boolean;
  canAccessTraining: boolean;
  canAccessMatches: boolean;
  blockReason: AttendanceBlockReason | null;
  blockReasonTraining: AttendanceBlockReason | null;
  blockReasonMatches: AttendanceBlockReason | null;
  access: MembershipPaymentAccess | null;
  isPaygTraining: boolean;
}> {
  const scope = options?.scope ?? "training";

  if (user.role === "ADMIN") {
    return {
      canAccess: true,
      canAccessTraining: true,
      canAccessMatches: true,
      blockReason: null,
      blockReasonTraining: null,
      blockReasonMatches: null,
      access: null,
      isPaygTraining: false,
    };
  }

  const clubMember = await prisma.clubMember.findUnique({
    where: { userId: user.id },
    select: {
      rosterRole: true,
      playerPaymentType: true,
      trainingTeamKey: true,
      active: true,
    },
  });
  if (clubMember?.rosterRole === "COACH") {
    return {
      canAccess: true,
      canAccessTraining: true,
      canAccessMatches: true,
      blockReason: null,
      blockReasonTraining: null,
      blockReasonMatches: null,
      access: null,
      isPaygTraining: false,
    };
  }

  const isPaygTraining = await resolvePaygTrainingState(user.id);
  const result = await getMembershipPaymentAccess(user.id);
  const hasMembershipAccess = Boolean(
    result?.access.canAccessTrainingAndMatches,
  );
  const membershipBlock: AttendanceBlockReason = result?.access.isOverdue
    ? "overdue"
    : "no_membership";

  if (isPaygTraining) {
    const canAccessTraining = true;
    const canAccessMatches = hasMembershipAccess;
    const canAccess = scope === "match" ? canAccessMatches : canAccessTraining;

    return {
      canAccess,
      canAccessTraining,
      canAccessMatches,
      blockReason: canAccess ? null : membershipBlock,
      blockReasonTraining: null,
      blockReasonMatches: canAccessMatches ? null : membershipBlock,
      access: result?.access ?? null,
      isPaygTraining: true,
    };
  }

  if (hasMembershipAccess) {
    return {
      canAccess: true,
      canAccessTraining: true,
      canAccessMatches: true,
      blockReason: null,
      blockReasonTraining: null,
      blockReasonMatches: null,
      access: result!.access,
      isPaygTraining: false,
    };
  }

  return {
    canAccess: false,
    canAccessTraining: false,
    canAccessMatches: false,
    blockReason: membershipBlock,
    blockReasonTraining: membershipBlock,
    blockReasonMatches: membershipBlock,
    access: result?.access ?? null,
    isPaygTraining: false,
  };
}

export async function hasAttendanceAccess(user: {
  id: string;
  role?: string | null;
}) {
  const info = await getAttendanceAccessInfo(user);
  return info.canAccess;
}
