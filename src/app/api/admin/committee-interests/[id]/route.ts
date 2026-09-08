import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { serializeCommitteeInterest } from "@/lib/committee-roles-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const committeeInterestActionSchema = z.object({
  action: z.enum(["review", "dismiss"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    const { data, response: parseError } = await parseJsonBody(
      request,
      committeeInterestActionSchema,
    );
    if (parseError || !data) return parseError!;

    const interest = await prisma.committeeInterest.findUnique({
      where: { id },
    });

    if (!interest) {
      return jsonError(
        "This response was not found. Refresh the page — it may have already been reviewed.",
        404,
      );
    }

    if (interest.status !== "NEW") {
      return jsonError(
        "This response is no longer new. Refresh the page to see the latest status.",
        409,
      );
    }

    const updated = await prisma.committeeInterest.update({
      where: { id },
      data: {
        status: data.action === "review" ? "REVIEWED" : "DISMISSED",
        reviewedAt: new Date(),
        reviewedByUserId: session!.user.id,
      },
    });

    return NextResponse.json({
      interest: serializeCommitteeInterest(updated),
    });
  } catch (error) {
    console.error("[committee-interests] PATCH failed", error);
    return jsonError(
      "We couldn't update this response. Refresh the page and try again.",
      500,
    );
  }
}
