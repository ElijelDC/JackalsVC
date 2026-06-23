import { NextResponse } from "next/server";
import { jsonError, requireClubMember } from "@/lib/api";
import {
  deleteVlyMembershipPhotoFile,
  saveVlyMembershipPhotoFile,
  validateVlyMembershipPhotoFile,
} from "@/lib/vly-membership-photo";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { clubMember, response } = await requireClubMember();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a VLY membership photo to upload.", 400);
  }

  const fileError = validateVlyMembershipPhotoFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    const vlyMembershipPhotoUrl = await saveVlyMembershipPhotoFile(
      clubMember!.id,
      file,
    );
    await deleteVlyMembershipPhotoFile(clubMember!.vlyMembershipPhotoUrl);

    const updated = await prisma.clubMember.update({
      where: { id: clubMember!.id },
      data: { vlyMembershipPhotoUrl },
      select: {
        id: true,
        vlyMembershipPhotoUrl: true,
        playerNumber: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "VLY photo upload failed.",
      400,
    );
  }
}

export async function DELETE() {
  const { clubMember, response } = await requireClubMember();
  if (response) return response;

  await deleteVlyMembershipPhotoFile(clubMember!.vlyMembershipPhotoUrl);

  const updated = await prisma.clubMember.update({
    where: { id: clubMember!.id },
    data: { vlyMembershipPhotoUrl: null },
    select: {
      id: true,
      vlyMembershipPhotoUrl: true,
      playerNumber: true,
    },
  });

  return NextResponse.json(updated);
}
