import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clubTeamMemberSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { memberId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    clubTeamMemberSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const member = await prisma.clubTeamMember.update({
      where: { id: memberId },
      data: {
        name: data.name,
        role: data.role,
        position: data.position ?? null,
        photoUrl: data.photoUrl ?? null,
        sortOrder: data.sortOrder,
      },
    });
    return NextResponse.json({ member });
  } catch {
    return jsonError("Team member not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { memberId } = await params;

  try {
    await prisma.clubTeamMember.delete({ where: { id: memberId } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Team member not found", 404);
  }
}
