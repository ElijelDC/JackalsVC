import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { normalizeVlyNumber } from "@/lib/vly-number";
import { registrationIsApproved } from "@/lib/registration-review";
import {
  deleteVlyMembershipPhotoFile,
  saveVlyMembershipPhotoFile,
  validateVlyMembershipPhotoFile,
} from "@/lib/vly-membership-photo";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const vlyNumber = normalizeVlyNumber(String(formData.get("vlyNumber") ?? ""));
  const registrationToken = String(formData.get("registrationToken") ?? "");
  const contactEmail = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!vlyNumber || !registrationToken) {
    return jsonError("Registration session expired — verify your VLY number again.", 400);
  }

  if (!contactEmail || !EMAIL_PATTERN.test(contactEmail)) {
    return jsonError("Enter a valid email address so we can notify you once approved.", 400);
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
        registrationContactEmail: contactEmail,
        registrationReviewStatus: "PENDING",
        registrationPhotoSubmittedAt: new Date(),
        registrationReviewedAt: null,
        registrationReviewedByUserId: null,
      },
      select: {
        name: true,
        vlyMembershipPhotoUrl: true,
        registrationReviewStatus: true,
        registrationPhotoSubmittedAt: true,
      },
    });

    await notifyAdmins({
      subject: `New registration to review — ${updated.name}`,
      replyTo: contactEmail,
      content: {
        heading: "New membership registration",
        paragraphs: [
          `${updated.name} submitted their VLY membership photo and is waiting for approval.`,
        ],
        details: [
          { label: "Member", value: updated.name },
          { label: "VLY number", value: vlyNumber },
          { label: "Email", value: contactEmail },
        ],
        imageUrl: updated.vlyMembershipPhotoUrl
          ? emailSiteUrl(updated.vlyMembershipPhotoUrl)
          : undefined,
        imageAlt: "Submitted VLY membership photo",
        ctaUrl: emailSiteUrl("/admin/registration-reviews"),
        ctaLabel: "Review registration",
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
