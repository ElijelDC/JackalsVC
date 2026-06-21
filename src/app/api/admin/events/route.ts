import { NextResponse } from "next/server";
import { getAdminEventsPayload } from "@/lib/admin-events";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { savesEventAttendanceUrl } from "@/lib/event-reclub";
import type { z } from "zod";

function toEventData(data: z.infer<typeof eventSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    type: data.type,
    location: data.location || null,
    attendanceUrl: savesEventAttendanceUrl(data.type)
      ? data.attendanceUrl || null
      : null,
  };
}

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

  const event = await prisma.event.create({ data: toEventData(data) });
  return NextResponse.json({ event }, { status: 201 });
}
