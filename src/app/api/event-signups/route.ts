import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import {
  enforceExclusiveCoachAttendance,
  notifyCoverCoachesAfterHeadDecline,
} from "@/lib/coach-session-coverage";
import { getAttendanceAccessInfo } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import {
  isTrainingOccurrenceCancelled,
  resolveOccurrenceDate,
} from "@/lib/training-occurrence";
import {
  canRespondToTrainingSession,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";
import {
  ensureTrainingSignupReminder,
  removeTrainingSignupReminder,
} from "@/lib/training-signups";
import { userCanSignUpForTrainingEvent } from "@/lib/training-teams";
import { eventSignupSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function validateTrainingEventAccess(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      trainingSession: { select: { trainingTeamKey: true } },
    },
  });

  if (!event) return { error: jsonError("Event not found", 404) };
  if (event.type !== "TRAINING") {
    return { error: jsonError("Attendance is only available for training sessions", 400) };
  }
  const attendanceAccess = await getAttendanceAccessInfo({ id: userId });
  if (!attendanceAccess.canAccess) {
    if (attendanceAccess.blockReason === "overdue") {
      return {
        error: jsonError(
          "Your membership payment is overdue. Pay outstanding instalments to respond to training.",
          403,
        ),
      };
    }
    return { error: jsonError("Active membership is required", 403) };
  }
  if (
    !(await userCanSignUpForTrainingEvent(
      userId,
      event.trainingSession?.trainingTeamKey,
    ))
  ) {
    return { error: jsonError("You can only respond for your team's training sessions", 403) };
  }
  if (event.startDate < new Date()) {
    return { error: jsonError("This event has already started", 400) };
  }
  if (event.trainingSessionId) {
    const cancelled = await isTrainingOccurrenceCancelled(
      event.trainingSessionId,
      resolveOccurrenceDate(event),
    );
    if (cancelled) {
      return { error: jsonError("This training session has been cancelled", 400) };
    }
  }

  return { event };
}

function validateResponseWindow(eventStartDate: Date) {
  if (!canRespondToTrainingSession(eventStartDate)) {
    return jsonError(
      `Responses open ${TRAINING_RESPONSE_OPENS_DAYS} days before the session`,
      400,
    );
  }
  return null;
}

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { data, response } = await parseJsonBody(request, eventSignupSchema);
  if (response || !data) return response!;

  const status = data.status ?? "ATTENDING";

  try {
    const result = await validateTrainingEventAccess(session!.user.id, data.eventId);
    if ("error" in result && result.error) return result.error;

    const windowError = validateResponseWindow(result.event.startDate);
    if (windowError) return windowError;

    const trainingTeamKey = result.event.trainingSession?.trainingTeamKey;
    if (trainingTeamKey) {
      const exclusive = await enforceExclusiveCoachAttendance({
        eventId: data.eventId,
        userId: session!.user.id,
        trainingTeamKey,
        status,
      });
      if (!exclusive.ok) {
        return jsonError(exclusive.error, exclusive.status);
      }
    }

    const signup = await prisma.eventSignup.upsert({
      where: {
        userId_eventId: {
          userId: session!.user.id,
          eventId: data.eventId,
        },
      },
      create: {
        userId: session!.user.id,
        eventId: data.eventId,
        status,
      },
      update: { status },
      include: { event: true },
    });

    if (status === "ATTENDING") {
      await ensureTrainingSignupReminder(session!.user.id, data.eventId);
    } else {
      await removeTrainingSignupReminder(session!.user.id, data.eventId);
    }

    if (status === "NOT_ATTENDING" && trainingTeamKey) {
      void notifyCoverCoachesAfterHeadDecline({
        eventId: data.eventId,
        headUserId: session!.user.id,
        trainingTeamKey,
      }).catch((error) => {
        console.error("[coach-cover] notify failed", error);
      });
    }

    return NextResponse.json({ signup }, { status: 201 });
  } catch {
    return jsonError("Failed to update attendance", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId) return jsonError("Event ID required", 400);

    const result = await validateTrainingEventAccess(session!.user.id, eventId);
    if ("error" in result && result.error) return result.error;

    await prisma.eventSignup.deleteMany({
      where: { userId: session!.user.id, eventId },
    });

    await removeTrainingSignupReminder(session!.user.id, eventId);

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to clear attendance response", 500);
  }
}
