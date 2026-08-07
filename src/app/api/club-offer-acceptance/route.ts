import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitClubOfferAcceptance } from "@/lib/submit-club-offer-acceptance";
import { clubOfferAcceptanceSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    clubOfferAcceptanceSchema,
  );
  if (response || !data) return response!;

  try {
    await submitClubOfferAcceptance(data);
    return NextResponse.json({
      success: true,
      message:
        "Offer accepted — thanks. The club will be in touch with next steps.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your acceptance right now. Please try again in a few minutes.",
      { route: "POST /api/club-offer-acceptance", cause: error },
    );
  }
}
