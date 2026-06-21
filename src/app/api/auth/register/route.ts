import { jsonError, parseJsonBody } from "@/lib/api";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  normalizeClubCode,
  validateRegistrationCode,
} from "@/lib/registration-code";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { data, response } = await parseJsonBody(request, registerSchema);
  if (response || !data) return response!;

  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return jsonError("An account with this email already exists", 409);
    }

    const normalizedCode = normalizeClubCode(data.clubCode);
    const registrationCode = await prisma.registrationCode.findUnique({
      where: { code: normalizedCode },
    });

    const codeError = validateRegistrationCode(registrationCode);
    if (codeError) return jsonError(codeError, 403);

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          registrationCodeId: registrationCode!.id,
        },
        select: { id: true, name: true, email: true },
      });

      await tx.registrationCode.update({
        where: { id: registrationCode!.id },
        data: { usedCount: { increment: 1 } },
      });

      return created;
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
