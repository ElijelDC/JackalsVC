import { NextResponse } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  createEmailVerification,
  PASSWORD_RESET_VERIFICATION_KEY,
} from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";
import {
  getVerificationEmailSendError,
  sendVerificationEmail,
} from "@/lib/send-verification-email";
import { forgotPasswordSendCodeSchema } from "@/lib/validations";

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, we sent a 6-digit reset code. Check your inbox and spam folder.";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    forgotPasswordSendCodeSchema,
    "Enter a valid email address.",
  );
  if (response || !data) return response!;

  const email = data.email;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { name: true },
  });

  if (!user) {
    return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
  }

  try {
    const { code } = await createEmailVerification({
      email,
      vlyNumber: PASSWORD_RESET_VERIFICATION_KEY,
    });

    await sendVerificationEmail({
      email,
      code,
      memberName: user.name,
      purpose: "password-reset",
    });
  } catch (error) {
    const mapped = getVerificationEmailSendError(error);
    if (mapped.status === 500) {
      console.error("Password reset email failed:", error);
    }
    return jsonError(mapped.message, mapped.status);
  }

  return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
}
