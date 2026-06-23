import { prisma } from "@/lib/prisma";
import { ClubRosterManager } from "@/components/admin/ClubRosterManager";
import { isCoachPaymentType } from "@/lib/coach-payment-type";
import { getTrainingSquads } from "@/lib/training-squads";

export const metadata = { title: "Admin · Registered Members" };

export default async function AdminRosterPage() {
  const [clubMembers, memberships, trainingTeams] = await Promise.all([
    prisma.clubMember.findMany({
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { vlyNumber: "asc" },
    }),
    prisma.membership.findMany({
      where: { endDate: { gt: new Date() } },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getTrainingSquads(),
  ]);

  const subscriptionByUserId = memberships.reduce<
    Record<string, { planName: string; paymentSchedule: string; status: string }>
  >((acc, membership) => {
    if (acc[membership.userId]) return acc;

    acc[membership.userId] = {
      planName: membership.plan.name,
      paymentSchedule: membership.paymentSchedule,
      status: membership.status,
    };
    return acc;
  }, {});

  return (
    <ClubRosterManager
      initialClubMembers={clubMembers.map((member) => ({
        ...member,
        coachPaymentType: isCoachPaymentType(member.coachPaymentType)
          ? member.coachPaymentType
          : member.rosterRole === "COACH"
            ? "PAID"
            : null,
      }))}
      trainingTeams={trainingTeams}
      subscriptionByUserId={subscriptionByUserId}
    />
  );
}
