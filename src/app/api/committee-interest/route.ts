import { jsonServerError, parseJsonBody } from "@/lib/api";
import { submitCommitteeInterest } from "@/lib/submit-committee-interest";
import { committeeInterestSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    committeeInterestSchema,
  );
  if (response || !data) return response!;

  try {
    await submitCommitteeInterest(data);
    return NextResponse.json({
      success: true,
      message:
        "Thanks — we've recorded your committee role preferences. We'll be in touch.",
    });
  } catch (error) {
    return jsonServerError(
      "We couldn't save your preferences right now. Please try again in a few minutes.",
      { route: "POST /api/committee-interest", cause: error },
    );
  }
}
