import { NextResponse } from "next/server";
import { jsonError, jsonServerError } from "@/lib/api";
import { validateTrialSessionProofFile } from "@/lib/trial-session-payment-proof";
import {
  createTrialSessionPaymentProof,
  getTrialSessionPaymentProofStatus,
  removeTrialSessionPaymentProof,
} from "@/lib/trial-sessions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const proofId = new URL(request.url).searchParams.get("proofId");

  if (!proofId) {
    return jsonError("Payment receipt ID required", 400);
  }

  try {
    const result = await getTrialSessionPaymentProofStatus(slug, proofId);
    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return NextResponse.json(result.proof);
  } catch (error) {
    return jsonServerError("Could not load payment receipt", {
      route: "GET /api/trial-sessions/[slug]/payment-proof",
      cause: error,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot");

    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file required", 400);
    }

    const fileError = validateTrialSessionProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const result = await createTrialSessionPaymentProof(slug, screenshot);
    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    return NextResponse.json({
      proof: result.proof,
      message: "Payment receipt uploaded. You can now register below.",
    });
  } catch (error) {
    return jsonServerError("Could not upload payment receipt", {
      route: "POST /api/trial-sessions/[slug]/payment-proof",
      cause: error,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const proofId = new URL(request.url).searchParams.get("proofId");

  if (!proofId) {
    return jsonError("Payment receipt ID required", 400);
  }

  try {
    const result = await removeTrialSessionPaymentProof(slug, proofId);
    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return NextResponse.json({
      message: "Payment receipt removed. Upload a new one before registering.",
    });
  } catch (error) {
    return jsonServerError("Could not remove payment receipt", {
      route: "DELETE /api/trial-sessions/[slug]/payment-proof",
      cause: error,
    });
  }
}
