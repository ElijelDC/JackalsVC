import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  syncTrainingSessionEvents,
} from "@/lib/training-events";
import { toTrainingSessionData } from "@/lib/training-utils";
import { trainingSessionSchema } from "@/lib/validations";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const sessions = await prisma.trainingSession.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSessionSchema,
  );
  if (parseError || !data) return parseError!;

  const session = await prisma.trainingSession.create({
    data: toTrainingSessionData(data),
  });
  await syncTrainingSessionEvents(session);
  return NextResponse.json({ session }, { status: 201 });
}
