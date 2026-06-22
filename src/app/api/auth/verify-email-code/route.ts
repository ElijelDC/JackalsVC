import { jsonError, parseJsonBody } from "@/lib/api";
import { verifyEmailCode } from "@/lib/email-verification";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { normalizeVlyNumber } from "@/lib/vly-number";
import { verifyEmailCodeSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, verifyEmailCodeSchema);
  if (response || !data) return response!;

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);
  const email = data.email.trim().toLowerCase();

  const tokenCheck = verifyRegistrationToken(data.registrationToken, vlyNumber);
  if (!tokenCheck.valid) {
    return jsonError(tokenCheck.error ?? "Invalid registration session", 403);
  }

  const result = await verifyEmailCode({
    email,
    vlyNumber,
    code: data.code,
  });

  if (!result.valid) {
    return jsonError(result.error ?? "Invalid verification code", 400);
  }

  return NextResponse.json({ verified: true });
}
