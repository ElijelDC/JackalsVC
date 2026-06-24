import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  clearEmailVerifications,
  PASSWORD_RESET_VERIFICATION_KEY,
  verifyEmailCode,
} from "@/lib/email-verification";
import { jsonError, parseJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { forgotPasswordResetSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(
    request,
    forgotPasswordResetSchema,
    "Invalid password reset details.",
  );
  if (response || !data) return response!;

  const email = data.email;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    return jsonError("Invalid reset code or email address.", 400);
  }

  const verified = await verifyEmailCode({
    email,
    vlyNumber: PASSWORD_RESET_VERIFICATION_KEY,
    code: data.code,
  });

  if (!verified.valid) {
    return jsonError(verified.error ?? "Invalid reset code.", 400);
  }

  const sameAsCurrent = await bcrypt.compare(data.newPassword, user.passwordHash);
  if (sameAsCurrent) {
    return jsonError(
      "New password must be different from your current password.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await clearEmailVerifications(email);

  return NextResponse.json({
    message: "Password updated. You can sign in with your new password.",
  });
}
