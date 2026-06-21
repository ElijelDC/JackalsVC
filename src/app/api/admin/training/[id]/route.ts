import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { trainingSessionSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSessionSchema,
  );
  if (parseError || !data) return parseError!;

  try {
    const session = await prisma.trainingSession.update({
      where: { id },
      data,
    });
    return NextResponse.json({ session });
  } catch {
    return jsonError("Training session not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.trainingSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Training session not found", 404);
  }
}
