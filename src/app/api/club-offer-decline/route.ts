import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitClubOfferDecline } from "@/lib/submit-club-offer-decline";
import { clubOfferDeclineSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, clubOfferDeclineSchema);
  if (response || !data) return response!;

  try {
    await submitClubOfferDecline(data);
    return NextResponse.json({
      success: true,
      message:
        "Offer declined — thanks for letting us know. We've notified the club.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your response right now. Please try again in a few minutes.",
      { route: "POST /api/club-offer-decline", cause: error },
    );
  }
}
