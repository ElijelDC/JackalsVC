import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import {
  CLUB_OFFER_RESPONSE_STATUSES,
  serializeClubOfferResponse,
} from "@/lib/club-offer-response-config";
import { CLUB_OFFER_TEAM_SLUGS } from "@/lib/club-offer-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const teamSlug = searchParams.get("teamSlug");

  const responses = await prisma.clubOfferAcceptance.findMany({
    where: {
      ...(status &&
      (CLUB_OFFER_RESPONSE_STATUSES as readonly string[]).includes(status)
        ? { status }
        : {}),
      ...(teamSlug &&
      (CLUB_OFFER_TEAM_SLUGS as readonly string[]).includes(teamSlug)
        ? { teamSlug }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    responses: responses.map(serializeClubOfferResponse),
  });
}
