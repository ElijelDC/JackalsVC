import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const reviews = await prisma.clubMember.findMany({
    where: {
      userId: null,
      active: true,
      registrationReviewStatus: "PENDING",
      vlyMembershipPhotoUrl: { startsWith: "/" },
    },
    orderBy: { registrationPhotoSubmittedAt: "asc" },
    select: {
      id: true,
      vlyNumber: true,
      name: true,
      vlyMembershipPhotoUrl: true,
      registrationPhotoSubmittedAt: true,
      rosterRole: true,
      trainingTeamKey: true,
    },
  });

  return NextResponse.json({
    reviews: reviews.map((review) => ({
      ...review,
      registrationPhotoSubmittedAt:
        review.registrationPhotoSubmittedAt?.toISOString() ?? null,
    })),
  });
}
