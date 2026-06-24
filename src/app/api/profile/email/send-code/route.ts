import { NextResponse } from "next/server";
import {
  createEmailVerification,
  profileEmailVerificationKey,
} from "@/lib/email-verification";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  getVerificationEmailSendError,
  sendVerificationEmail,
} from "@/lib/send-verification-email";
import { profileEmailSendCodeSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: parseResponse } = await parseJsonBody(
    request,
    profileEmailSendCodeSchema,
    "Invalid email address.",
  );
  if (parseResponse) return parseResponse;

  const email = data!.email;
  const userId = session!.user.id;

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!current) {
    return jsonError("User not found.", 404);
  }

  if (current.email === email) {
    return jsonError("That is already your email address.", 400);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    return jsonError("That email address is already in use.", 409);
  }

  try {
    const { code, expiresAt } = await createEmailVerification({
      email,
      vlyNumber: profileEmailVerificationKey(userId),
    });

    await sendVerificationEmail({
      email,
      code,
      memberName: current.name,
      purpose: "profile-change",
    });

    return NextResponse.json({
      message: "Verification code sent — check your email (and spam folder).",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    const mapped = getVerificationEmailSendError(error);
    if (mapped.status === 500) {
      console.error("Profile email verification send failed:", error);
    }
    return jsonError(mapped.message, mapped.status);
  }
}
