import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { membershipPlanSchema } from "@/lib/validations";
import type { z } from "zod";

function toPlanData(data: z.infer<typeof membershipPlanSchema>) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    durationMonths: data.durationMonths,
    features: data.features,
    active: data.active,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    membershipPlanSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: toPlanData(data),
    });
    return NextResponse.json({ plan });
  } catch {
    return jsonError("Plan not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  const memberCount = await prisma.membership.count({ where: { planId: id } });
  if (memberCount > 0) {
    return jsonError(
      "Cannot delete a plan with existing members. Hide it instead by unchecking “Visible on membership page”.",
      409,
    );
  }

  try {
    await prisma.membershipPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Plan not found", 404);
  }
}
