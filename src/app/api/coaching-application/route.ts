import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitCoachingApplication } from "@/lib/submit-coaching-application";
import { coachingApplicationSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    coachingApplicationSchema,
  );
  if (response || !data) return response!;

  try {
    await submitCoachingApplication(data);
    return NextResponse.json({
      success: true,
      message:
        "Thanks — your application has been sent. We'll be in touch soon.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your application right now. Please try again in a few minutes.",
      { route: "POST /api/coaching-application", cause: error },
    );
  }
}
