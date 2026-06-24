import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewActionSchema = z.object({
  action: z.enum(["approve", "decline"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    reviewActionSchema,
  );
  if (parseError || !data) return parseError!;

  const member = await prisma.clubMember.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      registrationReviewStatus: true,
      vlyMembershipPhotoUrl: true,
    },
  });

  if (!member) {
    return jsonError("Registration review not found.", 404);
  }

  if (member.userId) {
    return jsonError("This member already has an account.", 409);
  }

  if (member.registrationReviewStatus !== "PENDING") {
    return jsonError("This registration is no longer pending review.", 409);
  }

  if (!member.vlyMembershipPhotoUrl) {
    return jsonError("No membership photo was submitted.", 400);
  }

  const updated = await prisma.clubMember.update({
    where: { id },
    data: {
      registrationReviewStatus:
        data.action === "approve" ? "APPROVED" : "DECLINED",
      registrationReviewedAt: new Date(),
      registrationReviewedByUserId: session!.user.id,
    },
    select: {
      id: true,
      registrationReviewStatus: true,
      registrationReviewedAt: true,
    },
  });

  return NextResponse.json({
    review: {
      ...updated,
      registrationReviewedAt:
        updated.registrationReviewedAt?.toISOString() ?? null,
    },
  });
}
