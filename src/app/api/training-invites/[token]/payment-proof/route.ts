import { NextResponse } from "next/server";
import { jsonError, jsonServerError } from "@/lib/api";
import { validateTrainingInviteProofFile } from "@/lib/training-invite-payment-proof";
import {
  createTrainingInvitePaymentProof,
  getTrainingInvitePaymentProofStatus,
  removeTrainingInvitePaymentProof,
} from "@/lib/training-invites";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const proofId = new URL(request.url).searchParams.get("proofId");

  if (!proofId) {
    return jsonError("Payment receipt ID required", 400);
  }

  try {
    const result = await getTrainingInvitePaymentProofStatus(token, proofId);
    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return NextResponse.json(result.proof);
  } catch (error) {
    return jsonServerError("Could not load payment receipt", {
      route: "GET /api/training-invites/[token]/payment-proof",
      cause: error,
    });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot");

    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file required", 400);
    }

    const fileError = validateTrainingInviteProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const result = await createTrainingInvitePaymentProof(token, screenshot);
    if (!result.ok) {
      return jsonError(result.error, 400);
    }

    return NextResponse.json({
      proof: result.proof,
      message: "Payment receipt uploaded. You can now register below.",
    });
  } catch (error) {
    return jsonServerError("Could not upload payment receipt", {
      route: "POST /api/training-invites/[token]/payment-proof",
      cause: error,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const proofId = new URL(request.url).searchParams.get("proofId");

  if (!proofId) {
    return jsonError("Payment receipt ID required", 400);
  }

  try {
    const result = await removeTrainingInvitePaymentProof(token, proofId);
    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return NextResponse.json({
      message: "Payment receipt removed. Upload a new one before registering.",
    });
  } catch (error) {
    return jsonServerError("Could not remove payment receipt", {
      route: "DELETE /api/training-invites/[token]/payment-proof",
      cause: error,
    });
  }
}
