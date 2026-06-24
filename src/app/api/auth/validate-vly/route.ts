import { NextResponse } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/api";
import { createRegistrationToken } from "@/lib/registration-token";
import { VLY_NOT_FOUND_MESSAGE } from "@/lib/registration-review";
import { isValidVlyNumberFormat, normalizeVlyNumber } from "@/lib/vly-number";
import { validateVlySchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, validateVlySchema);
  if (response || !data) return response!;

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);

  if (!isValidVlyNumberFormat(vlyNumber)) {
    return jsonError("Enter a valid VLY number (e.g. VLY12345)", 400);
  }

  const clubMember = await prisma.clubMember.findUnique({
    where: { vlyNumber },
    select: {
      id: true,
      name: true,
      active: true,
      userId: true,
      vlyMembershipPhotoUrl: true,
      registrationReviewStatus: true,
      registrationPhotoSubmittedAt: true,
    },
  });

  if (!clubMember || !clubMember.active) {
    return jsonError(VLY_NOT_FOUND_MESSAGE, 404);
  }

  if (clubMember.userId) {
    return jsonError("This VLY number already has a member account — sign in instead", 409);
  }

  const registrationToken = createRegistrationToken(vlyNumber);

  return NextResponse.json({
    vlyNumber,
    name: clubMember.name,
    registrationToken,
    vlyMembershipPhotoUrl: clubMember.vlyMembershipPhotoUrl,
    registrationReviewStatus: clubMember.registrationReviewStatus,
    registrationPhotoSubmittedAt:
      clubMember.registrationPhotoSubmittedAt?.toISOString() ?? null,
  });
}
