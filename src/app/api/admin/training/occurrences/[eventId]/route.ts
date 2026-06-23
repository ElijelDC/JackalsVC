import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  deleteTrainingOccurrence,
  patchTrainingOccurrence,
} from "@/lib/training-schedule-actions";
import { coachTrainingOccurrenceSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { eventId } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    coachTrainingOccurrenceSchema,
  );
  if (parseError || !data) return parseError!;

  const result = await patchTrainingOccurrence(eventId, data);
  if (!result.ok) {
    const status = result.error === "End time must be after start time" ? 400 : 404;
    return jsonError(result.error, status);
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { eventId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") === "cancel" ? "cancel" : "reset";

  const result = await deleteTrainingOccurrence(eventId, action);
  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ success: true });
}
