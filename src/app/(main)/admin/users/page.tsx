import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      memberships: {
        select: {
          id: true,
          status: true,
          paymentSchedule: true,
          startDate: true,
          endDate: true,
          plan: { select: { name: true } },
        },
        orderBy: { startDate: "desc" },
      },
      _count: {
        select: { memberships: true, orders: true, eventReminders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    memberships: u.memberships.map((membership) => ({
      id: membership.id,
      status: membership.status,
      paymentSchedule: membership.paymentSchedule,
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate.toISOString(),
      planName: membership.plan.name,
    })),
  }));

  return <UsersManager initialUsers={serialized} />;
}
