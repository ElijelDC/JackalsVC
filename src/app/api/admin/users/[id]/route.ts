import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    userUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  if (session!.user.id === id && data.role !== "ADMIN") {
    return jsonError("You cannot remove your own admin access", 400);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { role: data.role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return jsonError("User not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  if (session!.user.id === id) {
    return jsonError("You cannot delete your own account", 400);
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return jsonError("User not found", 404);

  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return jsonError("Cannot delete the only admin account", 400);
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
