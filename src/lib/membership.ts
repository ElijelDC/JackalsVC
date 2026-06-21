import { prisma } from "@/lib/prisma";

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

export async function hasAttendanceAccess(user: {
  id: string;
  role?: string | null;
}) {
  if (user.role === "ADMIN") return true;
  const membership = await getActiveMembership(user.id);
  return !!membership;
}
