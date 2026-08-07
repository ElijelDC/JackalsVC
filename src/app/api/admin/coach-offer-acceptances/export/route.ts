import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { COACH_OFFER_TEAM_SLUGS } from "@/lib/coach-offer-config";
import { serializeCoachOfferResponse } from "@/lib/coach-offer-response-config";
import {
  buildCoachOfferResponsesWorkbook,
  coachOfferExportFilename,
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
  const rows = await prisma.coachOfferAcceptance.findMany({
    orderBy: { createdAt: "desc" },
  });
  const filtered = filterOfferResponses(rows.map(serializeCoachOfferResponse), {
    status: searchParams.get("status"),
    teamSlug: searchParams.get("teamSlug"),
    search: searchParams.get("search"),
    allowedStatuses: OFFER_RESPONSE_STATUSES,
    allowedTeamSlugs: COACH_OFFER_TEAM_SLUGS,
    extraSearchValues: (row) => [row.poloMaterial, row.poloSize],
  });

  const buffer = await buildCoachOfferResponsesWorkbook(filtered);
  const filename = coachOfferExportFilename();

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
