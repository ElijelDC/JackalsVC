import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { membershipCreateSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const memberships = await prisma.membership.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
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
  });

  return NextResponse.json({
    memberships: memberships.map((membership) => ({
      ...membership,
      startDate: membership.startDate.toISOString(),
      endDate: membership.endDate.toISOString(),
      paymentOverdueOverrideUntil:
        membership.paymentOverdueOverrideUntil?.toISOString() ?? null,
      paymentDeferralDueDate:
        membership.paymentDeferralDueDate?.toISOString() ?? null,
      paymentDeferralRequestedAt:
        membership.paymentDeferralRequestedAt?.toISOString() ?? null,
      payments: membership.payments.map((payment) => ({
        ...payment,
        dueDate: payment.dueDate?.toISOString() ?? null,
      })),
    })),
  });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    membershipCreateSchema,
  );
  if (parseError || !data) return parseError!;

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: data.planId },
  });
  if (!plan) return jsonError("Plan not found", 404);

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user) return jsonError("User not found", 404);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.durationMonths);

  const membership = await prisma.membership.create({
    data: {
      userId: data.userId,
      planId: data.planId,
      status: data.status ?? "ACTIVE",
      endDate,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
  });

  return NextResponse.json({ membership }, { status: 201 });
}
