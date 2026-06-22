import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}

export async function createEmailVerification(input: {
  email: string;
  vlyNumber: string;
}): Promise<{ code: string; expiresAt: Date }> {
  const email = input.email.trim().toLowerCase();
  const vlyNumber = input.vlyNumber.trim().toUpperCase();

  const recent = await prisma.emailVerification.findFirst({
    where: { email, vlyNumber },
    orderBy: { createdAt: "desc" },
  });

  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    throw new Error("Please wait a minute before requesting another code");
  }

  const code = generateVerificationCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await prisma.emailVerification.deleteMany({
    where: { email, vlyNumber, verifiedAt: null },
  });

  await prisma.emailVerification.create({
    data: {
      email,
      vlyNumber,
      codeHash,
      expiresAt,
    },
  });

  return { code, expiresAt };
}

export async function verifyEmailCode(input: {
  email: string;
  vlyNumber: string;
  code: string;
}): Promise<{ valid: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const vlyNumber = input.vlyNumber.trim().toUpperCase();
  const code = input.code.trim();

  if (!/^\d{6}$/.test(code)) {
    return { valid: false, error: "Enter the 6-digit code from your email" };
  }

  const record = await prisma.emailVerification.findFirst({
    where: { email, vlyNumber, verifiedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { valid: false, error: "No verification code found — request a new one" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "Verification code expired — request a new one" };
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    return { valid: false, error: "Incorrect verification code" };
  }

  await prisma.emailVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  });

  return { valid: true };
}

export async function requireVerifiedEmail(input: {
  email: string;
  vlyNumber: string;
}): Promise<{ valid: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const vlyNumber = input.vlyNumber.trim().toUpperCase();

  const record = await prisma.emailVerification.findFirst({
    where: {
      email,
      vlyNumber,
      verifiedAt: { not: null },
    },
    orderBy: { verifiedAt: "desc" },
  });

  if (!record?.verifiedAt) {
    return { valid: false, error: "Please verify your email with the code we sent" };
  }

  const verifiedRecently =
    Date.now() - record.verifiedAt.getTime() < CODE_TTL_MS + 5 * 60 * 1000;

  if (!verifiedRecently) {
    return { valid: false, error: "Email verification expired — request a new code" };
  }

  return { valid: true };
}

export async function clearEmailVerifications(email: string) {
  await prisma.emailVerification.deleteMany({
    where: { email: email.trim().toLowerCase() },
  });
}
