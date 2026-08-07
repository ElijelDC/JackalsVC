import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitCoachOfferDecline } from "@/lib/submit-coach-offer-decline";
import { coachOfferDeclineSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    coachOfferDeclineSchema,
  );
  if (response || !data) return response!;

  try {
    await submitCoachOfferDecline(data);
    return NextResponse.json({
      success: true,
      message:
        "Offer declined — thanks for letting us know. We've notified the club.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your response right now. Please try again in a few minutes.",
      { route: "POST /api/coach-offer-decline", cause: error },
    );
  }
}
