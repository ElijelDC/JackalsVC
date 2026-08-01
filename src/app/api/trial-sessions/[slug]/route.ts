import { NextResponse } from "next/server";
import { getPublicTrialSessionBySlug } from "@/lib/trial-sessions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const viewerEmail = searchParams.get("email");

  const result = await getPublicTrialSessionBySlug(slug, viewerEmail);

  if (!result.ok) {
    const message =
      result.reason === "inactive"
        ? "Registration is closed for this trial session."
        : "This trial session could not be found.";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  return NextResponse.json({
    session: result.session,
    viewerRegistered: result.viewerRegistered,
    viewerPendingApproval: result.viewerPendingApproval,
    viewerRejected: result.viewerRejected,
    viewerDisplayName: result.viewerDisplayName,
    viewerPaymentProofId: result.viewerPaymentProofId,
  });
}
