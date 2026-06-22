import { prisma } from "@/lib/prisma";
import {
  assessMembershipPaymentAccess,
  type MembershipPaymentAccess,
} from "@/lib/membership-overdue";

export type AttendanceBlockReason = "no_membership" | "overdue";

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

export async function getMembershipPaymentAccess(
  userId: string,
): Promise<{ membership: NonNullable<Awaited<ReturnType<typeof getCurrentMembership>>>; access: MembershipPaymentAccess } | null> {
  const membership = await getCurrentMembership(userId);
  if (!membership) return null;

  const access = assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: membership.paymentOverdueOverride,
    payments: membership.payments,
  });

  return { membership, access };
}

export async function getAttendanceAccessInfo(user: {
  id: string;
  role?: string | null;
}): Promise<{
  canAccess: boolean;
  blockReason: AttendanceBlockReason | null;
  access: MembershipPaymentAccess | null;
}> {
  if (user.role === "ADMIN") {
    return { canAccess: true, blockReason: null, access: null };
  }

  const result = await getMembershipPaymentAccess(user.id);
  if (!result) {
    return { canAccess: false, blockReason: "no_membership", access: null };
  }

  if (!result.access.canAccessTrainingAndMatches) {
    return {
      canAccess: false,
      blockReason: result.access.isOverdue ? "overdue" : "no_membership",
      access: result.access,
    };
  }

  return { canAccess: true, blockReason: null, access: result.access };
}

export async function hasAttendanceAccess(user: {
  id: string;
  role?: string | null;
}) {
  const info = await getAttendanceAccessInfo(user);
  return info.canAccess;
}
