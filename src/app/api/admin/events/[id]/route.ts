import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import type { z } from "zod";

function toEventData(data: z.infer<typeof eventSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    type: data.type,
    location: data.location || null,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(request, eventSchema);
  if (parseError || !data) return parseError!;

  try {
    const event = await prisma.event.update({
      where: { id },
      data: toEventData(data),
    });
    return NextResponse.json({ event });
  } catch {
    return jsonError("Event not found", 404);
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
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Event not found", 404);
  }
}
