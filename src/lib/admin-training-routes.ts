import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { sendTrainingSessionEventNewsletter } from "@/lib/event-newsletter";
import { prisma } from "@/lib/prisma";
import { syncTrainingSessionEvents } from "@/lib/training-events";
import { syncTrainingSquadDayFromSession } from "@/lib/training-squads";
import {
  SESSION_CATEGORIES,
  type SessionCategory,
  toTrainingSessionData,
} from "@/lib/training-utils";
import { trainingSessionSchema } from "@/lib/validations";

const sessionOrder = [
  { dayOfWeek: "asc" as const },
  { startTime: "asc" as const },
];

export async function listTrainingSessions(category: SessionCategory) {
  return prisma.trainingSession.findMany({
    where: { category },
    orderBy: sessionOrder,
  });
}

export async function createTrainingSession(
  request: Request,
  category: SessionCategory,
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSessionSchema,
  );
  if (parseError || !data) return parseError!;

  const session = await prisma.trainingSession.create({
    data: { ...toTrainingSessionData(data), category },
  });
  await syncTrainingSessionEvents(session);

  if (category === SESSION_CATEGORIES.FUN && data.notifyMembers) {
    await sendTrainingSessionEventNewsletter(session.id);
  }

  return NextResponse.json({ session }, { status: 201 });
}

export async function updateTrainingSession(
  request: Request,
  id: string,
  category: SessionCategory,
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const existing = await prisma.trainingSession.findFirst({
    where: { id, category },
  });
  if (!existing) return jsonError("Session not found", 404);

  const { data, response: parseError } = await parseJsonBody(
    request,
    trainingSessionSchema,
  );
  if (parseError || !data) return parseError!;

  const session = await prisma.trainingSession.update({
    where: { id },
    data: toTrainingSessionData(data),
  });
  await syncTrainingSquadDayFromSession(session);
  await syncTrainingSessionEvents(session);
  return NextResponse.json({ session });
}

export async function deleteTrainingSession(
  id: string,
  category: SessionCategory,
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const existing = await prisma.trainingSession.findFirst({
    where: { id, category },
  });
  if (!existing) return jsonError("Session not found", 404);

  const { deleteTrainingSessionCascade } = await import("@/lib/training-events");

  try {
    await deleteTrainingSessionCascade(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete training session:", error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unknown argument `trainingSessionId`")) {
      return jsonError(
        "Server is out of date. Stop the dev server, run npx prisma generate, then npm run dev again.",
        500,
      );
    }
    if (message.includes("SQLITE_BUSY") || message.includes("database is locked")) {
      return jsonError(
        "Database is locked. Close Prisma Studio (or any other DB tool) and try again.",
        500,
      );
    }
    return jsonError("Failed to delete session", 500);
  }
}

export async function getTrainingSessionsResponse(category: SessionCategory) {
  const { response } = await requireAdmin();
  if (response) return response;

  const sessions = await listTrainingSessions(category);
  return NextResponse.json({ sessions });
}
