import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { toPlanData, validateMembershipPlanPrice } from "@/lib/membership-config";
import { prisma } from "@/lib/prisma";
import { membershipPlanSchema } from "@/lib/validations";

function validatePlanPricing(data: { price: number; durationMonths: number }) {
  return validateMembershipPlanPrice(data.price, data.durationMonths);
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { price: "asc" },
    include: { _count: { select: { memberships: true } } },
  });

  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    membershipPlanSchema,
  );
  if (parseError || !data) return parseError!;

  const priceError = validatePlanPricing(data);
  if (priceError) return jsonError(priceError, 400);

  const plan = await prisma.membershipPlan.create({ data: toPlanData(data) });
  return NextResponse.json({ plan }, { status: 201 });
}
