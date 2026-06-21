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
      _count: {
        select: { memberships: true, orders: true, eventReminders: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return <UsersManager initialUsers={serialized} />;
}
