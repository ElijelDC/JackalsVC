import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { serializeTrialsApplication } from "@/lib/trials-application-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const trialsApplicationActionSchema = z.object({
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
      trialsApplicationActionSchema,
    );
    if (parseError || !data) return parseError!;

    const application = await prisma.trialsApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return jsonError(
        "This application was not found. Refresh the page — it may have already been reviewed.",
        404,
      );
    }

    if (application.status !== "NEW") {
      return jsonError(
        "This application is no longer new. Refresh the page to see the latest status.",
        409,
      );
    }

    const updated = await prisma.trialsApplication.update({
      where: { id },
      data: {
        status: data.action === "review" ? "REVIEWED" : "DISMISSED",
        reviewedAt: new Date(),
        reviewedByUserId: session!.user.id,
      },
    });

    return NextResponse.json({
      application: serializeTrialsApplication(updated),
    });
  } catch (error) {
    console.error("[trials-applications] PATCH failed", error);
    return jsonError(
      "We couldn't update this application. Refresh the page and try again.",
      500,
    );
  }
}
