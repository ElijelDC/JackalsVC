import { NextResponse } from "next/server";
import { jsonServerError, parseJsonBody } from "@/lib/api";
import { registerForTrainingInvite } from "@/lib/training-invites";
import { trainingInviteSignupSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { data, response } = await parseJsonBody(
    request,
    trainingInviteSignupSchema,
  );
  if (response || !data) return response!;

  try {
    const result = await registerForTrainingInvite(token, data);

    if (!result.ok) {
      if ("code" in result && result.code === "already_registered") {
        return NextResponse.json(
          {
            error: result.error,
            code: result.code,
            existingDisplayName: result.existingDisplayName,
          },
          { status: 409 },
        );
      }
      if ("code" in result && result.code === "already_pending") {
        return NextResponse.json(
          {
            error: result.error,
            code: result.code,
            existingDisplayName: result.existingDisplayName,
          },
          { status: 409 },
        );
      }
      if (
        "code" in result &&
        (result.code === "payment_proof_required" ||
          result.code === "payment_proof_invalid" ||
          result.code === "payment_proof_reuse")
      ) {
        return NextResponse.json(
          { error: result.error, code: result.code },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.resubmitted
          ? "Your request has been resubmitted for coach approval."
          : "Your request has been submitted. A coach will review it shortly.",
        signup: {
          id: result.signup.id,
          displayName: result.signup.displayName,
          status: result.signup.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonServerError(
      "We couldn't save your registration right now. Please try again in a few minutes.",
      { route: "POST /api/training-invites/[token]/signup", cause: error },
    );
  }
}
