import { jsonError, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const { planId } = await request.json();
    if (!planId) return jsonError("Plan ID required", 400);

    const plan = await prisma.membershipPlan.findFirst({
      where: { id: planId, active: true },
    });

    if (!plan) return jsonError("Plan not found", 404);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.durationMonths);

    const membership = await prisma.membership.create({
      data: {
        userId: session!.user.id,
        planId: plan.id,
        endDate,
        status: "ACTIVE",
      },
      include: { plan: true },
    });

    return NextResponse.json({ membership }, { status: 201 });
  } catch {
    return jsonError("Failed to create membership", 500);
  }
}
