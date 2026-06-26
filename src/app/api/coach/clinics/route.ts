import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { parseJsonBody } from "@/lib/api";
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

export async function GET() {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const events = await prisma.event.findMany({
    where: {
      type: "SKILLS_CLINIC",
      trainingSessionId: null,
    },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return NextResponse.json({
    clinics: events.map(serializeClinic),
    teamName: coach!.teamName,
  });
}

export async function POST(request: Request) {
  const { response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    coachClinicSchema,
  );
  if (parseError || !data) return parseError!;

  const event = await prisma.event.create({
    data: toManualEventData({
      ...data,
      type: "SKILLS_CLINIC",
    }),
  });

  return NextResponse.json({ clinic: serializeClinic(event) }, { status: 201 });
}
