import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitCoachOfferAcceptance } from "@/lib/submit-coach-offer-acceptance";
import { coachOfferAcceptanceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    coachOfferAcceptanceSchema,
  );
  if (response || !data) return response!;

  try {
    await submitCoachOfferAcceptance(data);
    return NextResponse.json({
      success: true,
      message:
        "Coach offer accepted — thanks. The club will be in touch with next steps.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your acceptance right now. Please try again in a few minutes.",
      { route: "POST /api/coach-offer-acceptance", cause: error },
    );
  }
}
