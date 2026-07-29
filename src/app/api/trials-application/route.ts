import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitTrialsApplication } from "@/lib/submit-trials-application";
import { trialsApplicationSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    trialsApplicationSchema,
  );
  if (response || !data) return response!;

  try {
    await submitTrialsApplication(data);
    return NextResponse.json({
      success: true,
      message:
        "Thanks — your signup has been received. We'll be in touch soon.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your application right now. Please try again in a few minutes.",
      { route: "POST /api/trials-application", cause: error },
    );
  }
}
