import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { normalizeVlyNumber } from "@/lib/vly-number";
import { registrationIsApproved } from "@/lib/registration-review";
import {
  deleteVlyMembershipPhotoFile,
  saveVlyMembershipPhotoFile,
  validateVlyMembershipPhotoFile,
} from "@/lib/vly-membership-photo";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const vlyNumber = normalizeVlyNumber(String(formData.get("vlyNumber") ?? ""));
  const registrationToken = String(formData.get("registrationToken") ?? "");

  if (!vlyNumber || !registrationToken) {
    return jsonError("Registration session expired — verify your VLY number again.", 400);
  }

  const tokenCheck = verifyRegistrationToken(registrationToken, vlyNumber);
  if (!tokenCheck.valid) {
    return jsonError(tokenCheck.error ?? "Invalid registration session", 403);
  }

  if (!(file instanceof File) || file.size === 0) {
    return jsonError("Choose a VLY membership photo to upload.", 400);
  }

  const fileError = validateVlyMembershipPhotoFile(file);
  if (fileError) return jsonError(fileError, 400);

  const clubMember = await prisma.clubMember.findUnique({
    where: { vlyNumber },
  });

  if (!clubMember || !clubMember.active) {
    return jsonError("This VLY number was not found on the club roster", 404);
  }

  if (clubMember.userId) {
    return jsonError("This VLY number already has a member account", 409);
  }

  if (registrationIsApproved(clubMember.registrationReviewStatus)) {
    return jsonError("Your membership photo is already approved.", 400);
  }

  try {
    const vlyMembershipPhotoUrl = await saveVlyMembershipPhotoFile(
      clubMember.id,
      file,
    );
    await deleteVlyMembershipPhotoFile(clubMember.vlyMembershipPhotoUrl);

    const updated = await prisma.clubMember.update({
      where: { id: clubMember.id },
      data: {
        vlyMembershipPhotoUrl,
        registrationReviewStatus: "PENDING",
        registrationPhotoSubmittedAt: new Date(),
        registrationReviewedAt: null,
        registrationReviewedByUserId: null,
      },
      select: {
        vlyMembershipPhotoUrl: true,
        registrationReviewStatus: true,
        registrationPhotoSubmittedAt: true,
      },
    });

    return NextResponse.json({
      vlyMembershipPhotoUrl: updated.vlyMembershipPhotoUrl,
      registrationReviewStatus: updated.registrationReviewStatus,
      registrationPhotoSubmittedAt:
        updated.registrationPhotoSubmittedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "VLY photo upload failed.",
      400,
    );
  }
}
