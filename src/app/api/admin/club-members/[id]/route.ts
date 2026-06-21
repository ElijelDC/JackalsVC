import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { clubMemberUpdateSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    clubMemberUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  const clubMember = await prisma.clubMember.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.active !== undefined ? { active: data.active } : {}),
    },
  });

  return NextResponse.json({ clubMember });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;
  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  if (existing.userId) {
    return jsonError("Cannot delete a roster entry linked to a member account", 409);
  }

  await prisma.clubMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
