import { NextResponse } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/api";
import { requireCoach } from "@/lib/coach-auth";
import {
  deleteTrialsApplication,
  updateTrialsApplicationStatus,
} from "@/lib/trials-applications";
import { z } from "zod";

const trialsApplicationActionSchema = z.object({
  action: z.enum(["review", "dismiss"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, response } = await requireCoach();
    if (response) return response;

    const { id } = await params;
    const { data, response: parseError } = await parseJsonBody(
      request,
      trialsApplicationActionSchema,
    );
    if (parseError || !data) return parseError!;

    const result = await updateTrialsApplicationStatus(
      id,
      data.action,
      session!.user.id,
    );

    if ("error" in result && result.error === "not_found") {
      return jsonError(
        "This application was not found. Refresh the page — it may have already been reviewed.",
        404,
      );
    }

    if ("error" in result && result.error === "invalid_status") {
      return jsonError(
        "This application is no longer new. Refresh the page to see the latest status.",
        409,
      );
    }

    if (!("application" in result) || !result.application) {
      return jsonError("We couldn't update this application.", 500);
    }

    return NextResponse.json({ application: result.application });
  } catch (error) {
    console.error("[coach/trials-applications] PATCH failed", error);
    return jsonError(
      "We couldn't update this application. Refresh the page and try again.",
      500,
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { response } = await requireCoach();
    if (response) return response;

    const { id } = await params;
    const result = await deleteTrialsApplication(id);

    if (result.error === "not_found") {
      return jsonError(
        "This application was not found. Refresh the page — it may have already been deleted.",
        404,
      );
    }

    if (result.error === "not_deletable") {
      return jsonError(
        "Only reviewed or dismissed signups can be deleted. Refresh the page and try again.",
        409,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[coach/trials-applications] DELETE failed", error);
    return jsonError(
      "We couldn't delete this application. Refresh the page and try again.",
      500,
    );
  }
}
