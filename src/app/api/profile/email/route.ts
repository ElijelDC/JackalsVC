import { NextResponse } from "next/server";
import {
  clearEmailVerifications,
  profileEmailVerificationKey,
  verifyEmailCode,
} from "@/lib/email-verification";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { profileEmailUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: parseResponse } = await parseJsonBody(
    request,
    profileEmailUpdateSchema,
    "Invalid email address.",
  );
  if (parseResponse) return parseResponse;

  const email = data!.email;
  const userId = session!.user.id;

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!current) {
    return jsonError("User not found.", 404);
  }

  if (current.email === email) {
    return NextResponse.json({ email });
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing && existing.id !== userId) {
    return jsonError("That email address is already in use.", 409);
  }

  const verified = await verifyEmailCode({
    email,
    vlyNumber: profileEmailVerificationKey(userId),
    code: data!.emailCode,
  });

  if (!verified.valid) {
    return jsonError(verified.error ?? "Invalid verification code.", 400);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { email },
    select: { email: true },
  });

  await clearEmailVerifications(current.email);
  await clearEmailVerifications(email);

  return NextResponse.json(updated);
}
