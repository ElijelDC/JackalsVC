import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import { toManualEventData } from "@/lib/manual-event-data";
import { prisma } from "@/lib/prisma";
import { coachClinicSchema } from "@/lib/validations";

function serializeClinic(event: {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  sessionFee: number | null;
  reclubUsername: string | null;
}) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    location: event.location,
    attendanceUrl: event.attendanceUrl,
    paymentUrl: event.paymentUrl,
    sessionFee: event.sessionFee,
    reclubUsername: event.reclubUsername,
    type: "SKILLS_CLINIC" as const,
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireCoach();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.type !== "SKILLS_CLINIC" || existing.trainingSessionId) {
    return jsonError("Clinic not found", 404);
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    coachClinicSchema,
  );
  if (parseError || !data) return parseError!;

  const event = await prisma.event.update({
    where: { id },
    data: toManualEventData({
      ...data,
      type: "SKILLS_CLINIC",
    }),
  });

  return NextResponse.json({ clinic: serializeClinic(event) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireCoach();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.type !== "SKILLS_CLINIC" || existing.trainingSessionId) {
    return jsonError("Clinic not found", 404);
  }

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
