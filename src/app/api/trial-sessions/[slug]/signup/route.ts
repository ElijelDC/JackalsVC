import { NextResponse } from "next/server";
import { jsonServerError, parseJsonBody } from "@/lib/api";
import {
  registerForTrialSession,
  updateTrialSessionSignup,
} from "@/lib/trial-sessions";
import { trialSessionSignupSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { data, response } = await parseJsonBody(
    request,
    trialSessionSignupSchema,
  );
  if (response || !data) return response!;

  try {
    const result = await registerForTrialSession(slug, data);

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
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "You're registered. We'll see you at the session.",
        signup: {
          id: result.signup.id,
          displayName: result.signup.displayName,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonServerError(
      "We couldn't save your registration right now. Please try again in a few minutes.",
      { route: "POST /api/trial-sessions/[slug]/signup", cause: error },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { data, response } = await parseJsonBody(
    request,
    trialSessionSignupSchema,
  );
  if (response || !data) return response!;

  try {
    const result = await updateTrialSessionSignup(slug, data);

    if (!result.ok) {
      const status =
        "code" in result && result.code === "not_registered" ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      message: result.unchanged
        ? "Your name is already set to that."
        : "Your name on the list has been updated.",
      signup: {
        id: result.signup.id,
        displayName: result.signup.displayName,
      },
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't update your registration right now. Please try again in a few minutes.",
      { route: "PATCH /api/trial-sessions/[slug]/signup", cause: error },
    );
  }
}
