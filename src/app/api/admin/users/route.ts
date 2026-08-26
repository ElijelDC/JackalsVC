import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const userSelect = {
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
    orderBy: { startDate: "desc" as const },
  },
  _count: {
    select: { memberships: true, orders: true, eventReminders: true },
  },
} as const;

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        status: membership.status,
        paymentSchedule: membership.paymentSchedule,
        startDate: membership.startDate.toISOString(),
        endDate: membership.endDate.toISOString(),
        planName: membership.plan.name,
      })),
    })),
  });
}
