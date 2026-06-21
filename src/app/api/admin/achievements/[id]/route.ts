import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { achievementSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    achievementSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const achievement = await prisma.achievement.update({
      where: { id },
      data: {
        title: data.title,
        season: data.season,
        description: data.description,
        imageUrl: data.imageUrl ?? null,
        sortOrder: data.sortOrder,
        type: data.type,
      },
    });
    return NextResponse.json({ achievement });
  } catch {
    return jsonError("Achievement not found", 404);
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
    await prisma.achievement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Achievement not found", 404);
  }
}
