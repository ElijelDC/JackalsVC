import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { CLUB_OFFER_TEAM_SLUGS } from "@/lib/club-offer-config";
import { serializeClubOfferResponse } from "@/lib/club-offer-response-config";
import {
  buildClubOfferResponsesWorkbook,
  clubOfferExportFilename,
} from "@/lib/offer-responses-export";
import {
  filterOfferResponses,
  OFFER_RESPONSE_STATUSES,
} from "@/lib/offer-response-shared";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const rows = await prisma.clubOfferAcceptance.findMany({
    orderBy: { createdAt: "desc" },
  });
  const filtered = filterOfferResponses(rows.map(serializeClubOfferResponse), {
    status: searchParams.get("status"),
    teamSlug: searchParams.get("teamSlug"),
    search: searchParams.get("search"),
    allowedStatuses: OFFER_RESPONSE_STATUSES,
    allowedTeamSlugs: CLUB_OFFER_TEAM_SLUGS,
    extraSearchValues: (row) => [
      row.preferredKitNumber1,
      row.preferredKitNumber2,
    ],
  });

  const buffer = await buildClubOfferResponsesWorkbook(filtered);
  const filename = clubOfferExportFilename();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
