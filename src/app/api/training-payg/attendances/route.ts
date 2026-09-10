import { NextResponse } from "next/server";
import { jsonError, jsonServerError, requireSession } from "@/lib/api";
import {
  ensureTrainingPaygAttendance,
  getTrainingPaygAttendanceForUserEvent,
} from "@/lib/training-payg";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) return jsonError("Event ID required", 400);

  try {
    const attendance = await getTrainingPaygAttendanceForUserEvent(
      session!.user.id,
      eventId,
    );
    return NextResponse.json({ attendance });
  } catch (error) {
    return jsonServerError("Could not load PAYG attendance", {
      route: "GET /api/training-payg/attendances",
      cause: error,
    });
  }
}

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const body = (await request.json()) as { eventId?: string };
    if (!body.eventId) return jsonError("Event ID required", 400);

    const result = await ensureTrainingPaygAttendance({
      userId: session!.user.id,
      eventId: body.eventId,
    });
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      attendance: result.attendance,
      bank: result.bank,
      paymentUrl: result.paymentUrl,
      alreadyApproved: result.alreadyApproved,
    });
  } catch (error) {
    return jsonServerError("Could not start PAYG payment", {
      route: "POST /api/training-payg/attendances",
      cause: error,
    });
  }
}
