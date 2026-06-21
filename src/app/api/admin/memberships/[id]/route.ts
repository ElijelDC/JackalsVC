import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { membershipUpdateSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    membershipUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const membership = await prisma.membership.update({
      where: { id },
      data: {
        status: data.status,
        endDate: new Date(data.endDate),
        ...(data.planId ? { planId: data.planId } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
    });
    return NextResponse.json({ membership });
  } catch {
    return jsonError("Membership not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.membership.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Membership not found", 404);
  }
}
