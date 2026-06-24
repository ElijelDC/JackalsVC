import { jsonError, parseJsonBody } from "@/lib/api";
import { createEmailVerification } from "@/lib/email-verification";
import { requireApprovedRegistration } from "@/lib/registration-review-server";
import { sendVerificationEmail, getVerificationEmailSendError } from "@/lib/send-verification-email";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { normalizeVlyNumber } from "@/lib/vly-number";
import { sendEmailCodeSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, sendEmailCodeSchema);
  if (response || !data) return response!;

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);
  const email = data.email.trim().toLowerCase();

  const tokenCheck = verifyRegistrationToken(data.registrationToken, vlyNumber);
  if (!tokenCheck.valid) {
    return jsonError(tokenCheck.error ?? "Invalid registration session", 403);
  }

  const approval = await requireApprovedRegistration(vlyNumber);
  if (approval.response) return approval.response;

  const clubMember = await prisma.clubMember.findUnique({
    where: { vlyNumber },
    select: { name: true },
  });

  if (!clubMember) {
    return jsonError("This VLY number was not found on the club roster", 404);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists", 409);
  }

  try {
    const { code, expiresAt } = await createEmailVerification({ email, vlyNumber });
    await sendVerificationEmail({
      email,
      code,
      memberName: clubMember.name,
    });

    return NextResponse.json({
      message: "Verification code sent — check your email (and spam folder).",
      expiresAt: expiresAt.toISOString(),
      delivered: true,
    });
  } catch (error) {
    const mapped = getVerificationEmailSendError(error);
    if (mapped.status === 500) {
      console.error("Send verification email failed:", error);
    }
    return jsonError(mapped.message, mapped.status);
  }
}
