import { NextResponse } from "next/server";
import { getAdminEventsPayload } from "@/lib/admin-events";
import { parseJsonBody, requireAdmin } from "@/lib/api";
import { sendEventNewsletter } from "@/lib/event-newsletter";
import { toManualEventData } from "@/lib/manual-event-data";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const events = await getAdminEventsPayload();
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(request, eventSchema);
  if (parseError || !data) return parseError!;

  const event = await prisma.event.create({ data: toManualEventData(data) });

  if (data.notifyMembers) {
    await sendEventNewsletter(event.id);
  }

  return NextResponse.json({ event }, { status: 201 });
}
