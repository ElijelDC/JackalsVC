import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { deleteAchievementImageFile } from "@/lib/achievement-image";
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
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) return jsonError("Achievement not found", 404);

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

    if (
      existing.imageUrl &&
      existing.imageUrl !== achievement.imageUrl
    ) {
      await deleteAchievementImageFile(existing.imageUrl);
    }

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
    const existing = await prisma.achievement.findUnique({ where: { id } });
    if (!existing) return jsonError("Achievement not found", 404);

    await prisma.achievement.delete({ where: { id } });
    await deleteAchievementImageFile(existing.imageUrl);
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Achievement not found", 404);
  }
}
