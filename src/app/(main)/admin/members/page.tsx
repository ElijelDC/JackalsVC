import { prisma } from "@/lib/prisma";
import { ClubRosterManager } from "@/components/admin/ClubRosterManager";
import { MembersManager } from "@/components/admin/MembersManager";

export const metadata = { title: "Admin · Members" };

export default async function AdminMembersPage() {
  const [memberships, users, plans, clubMembers] = await Promise.all([
    prisma.membership.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.membershipPlan.findMany({
      select: { id: true, name: true, price: true },
      orderBy: { price: "asc" },
    }),
    prisma.clubMember.findMany({
      include: {
        user: { select: { id: true, email: true } },
      },
      orderBy: { vlyNumber: "asc" },
    }),
  ]);

  const serialized = memberships.map((membership) => ({
    ...membership,
    startDate: membership.startDate.toISOString(),
    endDate: membership.endDate.toISOString(),
  }));

  return (
    <div className="space-y-10">
      <ClubRosterManager initialClubMembers={clubMembers} />
      <MembersManager
        initialMemberships={serialized}
        users={users}
        plans={plans}
      />
    </div>
  );
}
