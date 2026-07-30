import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  deleteDismissedTrialsApplication,
  updateTrialsApplicationStatus,
} from "@/lib/trials-applications";
import { z } from "zod";

const trialsApplicationActionSchema = z.object({
  action: z.enum(["review", "dismiss"]),
});

function mapStatusUpdateError(error: string) {
  if (error === "not_found") {
    return jsonError(
      "This application was not found. Refresh the page — it may have already been removed.",
      404,
    );
  }

  if (error === "invalid_status") {
    return jsonError(
      "This signup can't be updated from its current status. Refresh the page and try again.",
      409,
    );
  }

  return jsonError("We couldn't update this application.", 500);
}

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

    const allowedCurrentStatuses =
      data.action === "review"
        ? (["NEW", "DISMISSED"] as const)
        : (["NEW"] as const);

    const result = await updateTrialsApplicationStatus(
      id,
      data.action,
      session!.user.id,
      { allowedCurrentStatuses: [...allowedCurrentStatuses] },
    );

    if ("error" in result) {
      return mapStatusUpdateError(result.error as string);
    }

    return NextResponse.json({ application: result.application });
  } catch (error) {
    console.error("[trials-applications] PATCH failed", error);
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
    const { response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    const result = await deleteDismissedTrialsApplication(id);

    if (result.error === "not_found") {
      return jsonError(
        "This application was not found. Refresh the page — it may have already been deleted.",
        404,
      );
    }

    if (result.error === "not_dismissed") {
      return jsonError(
        "Only dismissed signups can be deleted. Refresh the page and try again.",
        409,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[trials-applications] DELETE failed", error);
    return jsonError(
      "We couldn't delete this application. Refresh the page and try again.",
      500,
    );
  }
}
