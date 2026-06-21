import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.eventReminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Reminder not found", 404);
  }
}
