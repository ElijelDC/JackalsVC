import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import {
  deleteVlyMembershipPhotoFile,
  saveVlyMembershipPhotoFile,
  validateVlyMembershipPhotoFile,
} from "@/lib/vly-membership-photo";
import { prisma } from "@/lib/prisma";

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
    return jsonError("Choose a VLY membership photo to upload.", 400);
  }

  const fileError = validateVlyMembershipPhotoFile(file);
  if (fileError) return jsonError(fileError, 400);

  try {
    const vlyMembershipPhotoUrl = await saveVlyMembershipPhotoFile(id, file);
    await deleteVlyMembershipPhotoFile(existing.vlyMembershipPhotoUrl);

    const clubMember = await prisma.clubMember.update({
      where: { id },
      data: {
        vlyMembershipPhotoUrl,
        registrationPhotoSubmittedAt: new Date(),
      },
    });

    return NextResponse.json({ clubMember, vlyMembershipPhotoUrl });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "VLY photo upload failed.",
      400,
    );
  }
}
