import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import {
  deleteProfileImageFile,
  saveProfileImageFile,
  validateProfileImageFile,
} from "@/lib/profile-image";
import { prisma } from "@/lib/prisma";
import { syncClubTeamsForClubMember } from "@/lib/club-team-roster-sync";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;

  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a profile image to upload.", 400);
  }

  const fileError = validateProfileImageFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    const profileImageUrl = await saveProfileImageFile(id, file);
    await deleteProfileImageFile(existing.profileImageUrl);

    const clubMember = await prisma.clubMember.update({
      where: { id },
      data: { profileImageUrl },
    });

    await syncClubTeamsForClubMember(id);

    return NextResponse.json({ clubMember, profileImageUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Profile image upload failed.",
      400,
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await context.params;

  const existing = await prisma.clubMember.findUnique({ where: { id } });
  if (!existing) return jsonError("Roster entry not found", 404);

  await deleteProfileImageFile(existing.profileImageUrl);

  const clubMember = await prisma.clubMember.update({
    where: { id },
    data: { profileImageUrl: null },
  });

  await syncClubTeamsForClubMember(id);

  return NextResponse.json({ clubMember });
}
