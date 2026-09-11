import { NextResponse } from "next/server";
import { jsonError, jsonServerError } from "@/lib/api";
import { getPublicTrainingInviteByToken } from "@/lib/training-invites";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const email = new URL(request.url).searchParams.get("email");

  try {
    const result = await getPublicTrainingInviteByToken(token, email);
    if (!result.ok) {
      return jsonError(
        result.reason === "inactive"
          ? "This invite is no longer active."
          : "Invite not found.",
        404,
      );
    }

    return NextResponse.json({
      invite: result.invite,
      viewerRegistered: result.viewerRegistered,
      viewerPendingApproval: result.viewerPendingApproval,
      viewerRejected: result.viewerRejected,
      viewerDisplayName: result.viewerDisplayName,
      viewerPaymentProofId: result.viewerPaymentProofId,
    });
  } catch (error) {
    return jsonServerError("Could not load invite", {
      route: "GET /api/training-invites/[token]",
      cause: error,
    });
  }
}
