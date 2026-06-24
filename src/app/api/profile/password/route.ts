import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const { data, response: parseResponse } = await parseJsonBody(
    request,
    changePasswordSchema,
    "Invalid password details.",
  );
  if (parseResponse) return parseResponse;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { passwordHash: true },
  });

  if (!user) {
    return jsonError("User not found.", 404);
  }

  const currentValid = await bcrypt.compare(
    data!.currentPassword,
    user.passwordHash,
  );

  if (!currentValid) {
    return jsonError("Current password is incorrect.", 400);
  }

  if (data!.currentPassword === data!.newPassword) {
    return jsonError(
      "New password must be different from your current password.",
      400,
    );
  }

  const passwordHash = await bcrypt.hash(data!.newPassword, 12);

  await prisma.user.update({
    where: { id: session!.user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true });
}
