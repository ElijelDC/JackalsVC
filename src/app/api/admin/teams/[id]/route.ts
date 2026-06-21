import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { clubTeamSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  const team = await prisma.clubTeam.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!team) {
    return jsonError("Team not found", 404);
  }

  return NextResponse.json({ team });
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
    clubTeamSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const team = await prisma.clubTeam.update({
      where: { id },
      data: {
        name: data.name,
        level: data.level,
        description: data.description,
        details: data.details ?? null,
        sortOrder: data.sortOrder,
      },
    });
    return NextResponse.json({ team });
  } catch {
    return jsonError("Team not found", 404);
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
    await prisma.clubTeam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Team not found", 404);
  }
}
