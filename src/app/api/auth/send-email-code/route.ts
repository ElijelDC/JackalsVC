import { jsonError, parseJsonBody } from "@/lib/api";
import { createEmailVerification } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/send-verification-email";
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

  const clubMember = await prisma.clubMember.findUnique({
    where: { vlyNumber },
  });

  if (!clubMember || !clubMember.active) {
    return jsonError("This VLY number was not found on the club roster", 404);
  }

  if (clubMember.userId) {
    return jsonError("This VLY number already has a member account", 409);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("An account with this email already exists", 409);
  }

  try {
    const { code, expiresAt } = await createEmailVerification({ email, vlyNumber });
    const { delivered } = await sendVerificationEmail({
      email,
      code,
      memberName: clubMember.name,
    });

    return NextResponse.json({
      message: delivered
        ? "Verification code sent — check your email (and spam folder)."
        : "Email is not configured — use the development code shown below.",
      expiresAt: expiresAt.toISOString(),
      delivered,
      ...(process.env.NODE_ENV === "development" && !delivered ? { devCode: code } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("wait a minute")) {
      return jsonError(error.message, 429);
    }

    if (process.env.NODE_ENV === "development") {
      console.error("Send verification email failed:", error);
    }

    return jsonError("Could not send verification email. Please try again.", 500);
  }
}
