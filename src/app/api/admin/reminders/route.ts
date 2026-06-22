import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const reminders = await prisma.eventReminder.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true, startDate: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reminders });
}
