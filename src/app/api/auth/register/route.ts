import { jsonError, parseJsonBody } from "@/lib/api";
import {
  clearEmailVerifications,
  requireVerifiedEmail,
  verifyEmailCode,
} from "@/lib/email-verification";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { verifyRegistrationToken } from "@/lib/registration-token";
import { requireApprovedRegistration } from "@/lib/registration-review-server";
import { normalizeVlyNumber } from "@/lib/vly-number";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, registerSchema);
  if (response || !data) return response!;

  const vlyNumber = normalizeVlyNumber(data.vlyNumber);
  const email = data.email.trim().toLowerCase();

  const tokenCheck = verifyRegistrationToken(data.registrationToken, vlyNumber);
  if (!tokenCheck.valid) {
    return jsonError(tokenCheck.error ?? "Invalid registration session", 403);
  }

  const approval = await requireApprovedRegistration(vlyNumber);
  if (approval.response) return approval.response;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
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

    const emailVerified = await requireVerifiedEmail({ email, vlyNumber });
    if (!emailVerified.valid) {
      const codeCheck = await verifyEmailCode({
        email,
        vlyNumber,
        code: data.emailCode,
      });
      if (!codeCheck.valid) {
        return jsonError(codeCheck.error ?? "Email verification required", 400);
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: clubMember.name,
          email,
          passwordHash,
        },
        select: { id: true, name: true, email: true },
      });

      await tx.clubMember.update({
        where: { id: clubMember.id },
        data: { userId: created.id },
      });

      return created;
    });

    await clearEmailVerifications(email);

    await notifyAdmins({
      subject: `New member account created — ${user.name}`,
      content: {
        heading: "New member account",
        paragraphs: [
          `${user.name} finished registration and now has a Jackals VC account.`,
        ],
        details: [
          { label: "Member", value: user.name },
          { label: "VLY number", value: vlyNumber },
          { label: "Email", value: user.email },
        ],
        ctaUrl: emailSiteUrl("/admin/users"),
        ctaLabel: "View members",
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
