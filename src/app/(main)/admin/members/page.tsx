import { AdminMembersHub } from "@/components/admin/AdminMembersHub";
import {
  type AdminMembersMembership,
  type AdminPersonRow,
  parseAdminMembersFocus,
} from "@/lib/admin-members-hub";
import { serializeClubMemberForAdmin } from "@/lib/club-team-roster-sync";
import {
  isCoachPaymentType,
  type CoachPaymentType,
} from "@/lib/coach-payment-type";
import { normalizePlayerPaymentType } from "@/lib/player-payment-type";
import { prisma } from "@/lib/prisma";
import { getTrainingSquads } from "@/lib/training-squads";

export const metadata = { title: "Admin · Members" };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = await searchParams;

  const [clubMembers, users, memberships, plans, trainingTeams] =
    await Promise.all([
      prisma.clubMember.findMany({
        include: {
          user: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
          coachSquads: { select: { trainingTeamKey: true, priority: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          clubMember: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.membership.findMany({
        include: {
          plan: { select: { id: true, name: true, price: true } },
          payments: {
            select: {
              status: true,
              dueDate: true,
              amount: true,
              installmentNumber: true,
            },
            orderBy: { dueDate: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.membershipPlan.findMany({
        select: { id: true, name: true, price: true },
        orderBy: { price: "asc" },
      }),
      getTrainingSquads(),
    ]);

  const membershipsByUserId = new Map<string, AdminMembersMembership[]>();
  for (const membership of memberships) {
    const row: AdminMembersMembership = {
      id: membership.id,
      status: membership.status,
      paymentSchedule: membership.paymentSchedule,
      paymentOverdueOverride: membership.paymentOverdueOverride,
      paymentOverdueOverrideNote: membership.paymentOverdueOverrideNote,
      paymentOverdueOverrideUntil:
        membership.paymentOverdueOverrideUntil?.toISOString() ?? null,
      paymentDeferralExcuse: membership.paymentDeferralExcuse,
      paymentDeferralDueDate:
        membership.paymentDeferralDueDate?.toISOString() ?? null,
      paymentDeferralRequestedAt:
        membership.paymentDeferralRequestedAt?.toISOString() ?? null,
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate.toISOString(),
      userId: membership.userId,
      plan: membership.plan,
      payments: membership.payments.map((payment) => ({
        status: payment.status,
        dueDate: payment.dueDate?.toISOString() ?? null,
        amount: payment.amount,
        installmentNumber: payment.installmentNumber,
      })),
    };
    const list = membershipsByUserId.get(membership.userId) ?? [];
    list.push(row);
    membershipsByUserId.set(membership.userId, list);
  }

  const now = Date.now();
  function currentMembership(userId: string | null | undefined) {
    if (!userId) return null;
    const list = membershipsByUserId.get(userId) ?? [];
    return (
      list.find(
        (membership) =>
          new Date(membership.endDate).getTime() > now &&
          membership.status !== "CANCELLED",
      ) ??
      list[0] ??
      null
    );
  }

  const people: AdminPersonRow[] = [];
  const linkedUserIds = new Set<string>();

  for (const member of clubMembers) {
    const serialized = serializeClubMemberForAdmin(member);
    const coachPaymentType: CoachPaymentType | null = isCoachPaymentType(
      member.coachPaymentType,
    )
      ? member.coachPaymentType
      : member.rosterRole === "COACH"
        ? "PAID"
        : null;

    const user = member.user
      ? {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.user.role,
          createdAt: member.user.createdAt.toISOString(),
        }
      : null;

    if (user) linkedUserIds.add(user.id);

    const userMemberships = user
      ? (membershipsByUserId.get(user.id) ?? [])
      : [];

    people.push({
      id: `roster:${member.id}`,
      kind: "roster",
      name: member.name,
      email: user?.email ?? null,
      clubMember: {
        id: member.id,
        vlyNumber: member.vlyNumber,
        name: member.name,
        active: member.active,
        rosterRole: member.rosterRole,
        coachPaymentType,
        playerPaymentType: normalizePlayerPaymentType(member.playerPaymentType),
        trainingTeamKey: member.trainingTeamKey,
        trainingTeamKeys: serialized.trainingTeamKeys,
        coachSquadPriorities: serialized.coachSquadPriorities,
        profileImageUrl: member.profileImageUrl,
        vlyMembershipPhotoUrl: member.vlyMembershipPhotoUrl,
        userId: member.userId,
        user: member.user
          ? { id: member.user.id, email: member.user.email }
          : null,
      },
      user,
      memberships: userMemberships,
      currentMembership: currentMembership(user?.id),
    });
  }

  for (const user of users) {
    if (user.clubMember || linkedUserIds.has(user.id)) continue;
    people.push({
      id: `user:${user.id}`,
      kind: "account_only",
      name: user.name,
      email: user.email,
      clubMember: null,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      memberships: membershipsByUserId.get(user.id) ?? [],
      currentMembership: currentMembership(user.id),
    });
  }

  people.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AdminMembersHub
      initialPeople={people}
      plans={plans}
      trainingTeams={trainingTeams.map((team) => ({
        key: team.key,
        name: team.name,
        dayLabel: team.dayLabel,
      }))}
      initialFocus={parseAdminMembersFocus(focus)}
    />
  );
}
