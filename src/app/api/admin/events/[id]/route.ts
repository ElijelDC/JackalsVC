import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { syncTrainingSessionEvents } from "@/lib/training-events";
import {
  cancelTrainingOccurrence,
  resolveOccurrenceDate,
  startOfOccurrenceDay,
  upsertOccurrenceOverride,
} from "@/lib/training-occurrence";
import { eventSchema, trainingOccurrenceSchema } from "@/lib/validations";
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

function toOccurrenceOverrideData(data: z.infer<typeof trainingOccurrenceSchema>) {
  return {
    title: data.title,
    description: data.description || null,
    startDate: new Date(data.startDate),
    endDate: data.endDate ? new Date(data.endDate) : null,
    location: data.location || null,
    coach: data.coach?.trim() || null,
    attendanceUrl: data.attendanceUrl ?? null,
    paymentUrl: data.paymentUrl ?? null,
  };
}

function serializeEvent(event: {
  id: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  type: string;
  location: string | null;
  trainingSessionId: string | null;
  trainingOccurrenceDate: Date | null;
  createdAt: Date;
}) {
  return {
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    trainingOccurrenceDate: event.trainingOccurrenceDate?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return jsonError("Event not found", 404);

    if (existing.trainingSessionId) {
      const { data, response: parseError } = await parseJsonBody(
        request,
        trainingOccurrenceSchema,
      );
      if (parseError || !data) return parseError!;

      const session = await prisma.trainingSession.findUnique({
        where: { id: existing.trainingSessionId },
      });
      if (!session) return jsonError("Training session not found", 404);

      const occurrenceDate = resolveOccurrenceDate(existing);
      await upsertOccurrenceOverride(
        existing.trainingSessionId,
        occurrenceDate,
        toOccurrenceOverrideData(data),
      );
      await syncTrainingSessionEvents(session);

      const updated = await prisma.event.findFirst({
        where: {
          trainingSessionId: existing.trainingSessionId,
          trainingOccurrenceDate: startOfOccurrenceDay(occurrenceDate),
        },
      });

      return NextResponse.json({
        success: true,
        event: updated ? serializeEvent(updated) : null,
      });
    }

    const { data, response: parseError } = await parseJsonBody(
      request,
      eventSchema,
    );
    if (parseError || !data) return parseError!;

    const event = await prisma.event.update({
      where: { id },
      data: toEventData(data),
    });

    return NextResponse.json({ success: true, event: serializeEvent(event) });
  } catch (error) {
    console.error("PUT /api/admin/events/[id] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update event";
    return jsonError(message, 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) return jsonError("Event not found", 404);

    if (existing.trainingSessionId) {
      const session = await prisma.trainingSession.findUnique({
        where: { id: existing.trainingSessionId },
      });
      if (!session) return jsonError("Training session not found", 404);

      const occurrenceDate = resolveOccurrenceDate(existing);
      await cancelTrainingOccurrence(existing.trainingSessionId, occurrenceDate);
      await syncTrainingSessionEvents(session);

      return NextResponse.json({ success: true });
    }

    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/events/[id] failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete event";
    return jsonError(message, 500);
  }
}
