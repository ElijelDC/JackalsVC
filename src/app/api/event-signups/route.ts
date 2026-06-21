import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { eventSignupSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { data, response } = await parseJsonBody(request, eventSignupSchema);
  if (response || !data) return response!;

  try {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) return jsonError("Event not found", 404);
    if (event.startDate < new Date()) {
      return jsonError("This event has already started", 400);
    }

    const signup = await prisma.eventSignup.upsert({
      where: {
        userId_eventId: {
          userId: session!.user.id,
          eventId: data.eventId,
        },
      },
      create: {
        userId: session!.user.id,
        eventId: data.eventId,
        status: "CONFIRMED",
      },
      update: { status: "CONFIRMED" },
      include: { event: true },
    });

    return NextResponse.json({ signup }, { status: 201 });
  } catch {
    return jsonError("Failed to sign up for event", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return jsonError("Event ID required", 400);

    await prisma.eventSignup.deleteMany({
      where: { userId: session!.user.id, eventId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to cancel signup", 500);
  }
}
