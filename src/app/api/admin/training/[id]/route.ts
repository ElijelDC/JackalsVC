import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  deleteTrainingSessionCascade,
  syncTrainingSessionEvents,
} from "@/lib/training-events";
import { toTrainingSessionData } from "@/lib/training-utils";
import { trainingSessionSchema } from "@/lib/validations";

function deleteErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unknown argument `trainingSessionId`")) {
    return "Server is out of date. Stop the dev server, run npx prisma generate, then npm run dev again.";
  }
  if (message.includes("SQLITE_BUSY") || message.includes("database is locked")) {
    return "Database is locked. Close Prisma Studio (or any other DB tool) and try again.";
  }
  if (message.includes("Record to delete does not exist")) {
    return "Training session not found — refresh the page.";
  }
  return "Failed to delete training session";
}

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
      data: toTrainingSessionData(data),
    });
    await syncTrainingSessionEvents(session);
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

  const existing = await prisma.trainingSession.findUnique({ where: { id } });
  if (!existing) return jsonError("Training session not found", 404);

  try {
    await deleteTrainingSessionCascade(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete training session:", error);
    return jsonError(deleteErrorMessage(error), 500);
  }
}
