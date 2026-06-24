import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  registrationIsApproved,
  REGISTRATION_NOT_APPROVED_MESSAGE,
} from "@/lib/registration-review";

export async function requireApprovedRegistration(vlyNumber: string) {
  const clubMember = await prisma.clubMember.findUnique({
    where: { vlyNumber },
    select: {
      id: true,
      active: true,
      userId: true,
      registrationReviewStatus: true,
    },
  });

  if (!clubMember || !clubMember.active) {
    return {
      clubMember: null,
      response: jsonError("This VLY number was not found on the club roster", 404),
    };
  }

  if (clubMember.userId) {
    return {
      clubMember: null,
      response: jsonError(
        "This VLY number already has a member account — sign in instead",
        409,
      ),
    };
  }

  if (!registrationIsApproved(clubMember.registrationReviewStatus)) {
    return {
      clubMember: null,
      response: jsonError(REGISTRATION_NOT_APPROVED_MESSAGE, 403),
    };
  }

  return { clubMember, response: null };
}
