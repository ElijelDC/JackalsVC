import { jsonError, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const { eventId } = await request.json();
    if (!eventId) return jsonError("Event ID required", 400);

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return jsonError("Event not found", 404);

    const reminder = await prisma.eventReminder.upsert({
      where: {
        userId_eventId: {
          userId: session!.user.id,
          eventId,
        },
      },
      create: {
        userId: session!.user.id,
        eventId,
      },
      update: {},
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch {
    return jsonError("Failed to set reminder", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return jsonError("Event ID required", 400);

    await prisma.eventReminder.deleteMany({
      where: { userId: session!.user.id, eventId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to remove reminder", 500);
  }
}
