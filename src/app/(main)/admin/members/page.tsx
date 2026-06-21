import { prisma } from "@/lib/prisma";
import { MembersManager } from "@/components/admin/MembersManager";

export const metadata = { title: "Admin · Members" };

export default async function AdminMembersPage() {
  const [memberships, users, plans] = await Promise.all([
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
  ]);

  const serialized = memberships.map((m) => ({
    ...m,
    startDate: m.startDate.toISOString(),
    endDate: m.endDate.toISOString(),
  }));

  return (
    <MembersManager
      initialMemberships={serialized}
      users={users}
      plans={plans}
    />
  );
}
