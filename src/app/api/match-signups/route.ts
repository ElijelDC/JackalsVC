import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { getAttendanceAccessInfo } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import {
  canRespondToTrainingSession,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";
import { userCanSignUpForTrainingEvent } from "@/lib/training-teams";
import { matchSignupSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

async function validateMatchAccess(userId: string, matchId: string) {
  const match = await prisma.teamMatch.findUnique({ where: { id: matchId } });

  if (!match) return { error: jsonError("Match not found", 404) };
  const attendanceAccess = await getAttendanceAccessInfo({ id: userId });
  if (!attendanceAccess.canAccess) {
    if (attendanceAccess.blockReason === "overdue") {
      return {
        error: jsonError(
          "Your membership payment is overdue. Pay outstanding instalments to respond to matches.",
          403,
        ),
      };
    }
    return { error: jsonError("Active membership is required", 403) };
  }
  if (!(await userCanSignUpForTrainingEvent(userId, match.trainingTeamKey))) {
    return {
      error: jsonError("You can only respond for your team's matches", 403),
    };
  }
  if (match.matchStart < new Date()) {
    return { error: jsonError("This match has already started", 400) };
  }
  if (match.cancelled) {
    return { error: jsonError("This match has been cancelled", 400) };
  }

  return { match };
}

function validateResponseWindow(matchStart: Date) {
  if (!canRespondToTrainingSession(matchStart)) {
    return jsonError(
      `Responses open ${TRAINING_RESPONSE_OPENS_DAYS} days before the match`,
      400,
    );
  }
  return null;
}

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { data, response } = await parseJsonBody(request, matchSignupSchema);
  if (response || !data) return response!;

  const status = data.status ?? "ATTENDING";

  try {
    const result = await validateMatchAccess(session!.user.id, data.matchId);
    if ("error" in result && result.error) return result.error;

    const windowError = validateResponseWindow(result.match.matchStart);
    if (windowError) return windowError;

    const signup = await prisma.matchSignup.upsert({
      where: {
        userId_matchId: {
          userId: session!.user.id,
          matchId: data.matchId,
        },
      },
      create: {
        userId: session!.user.id,
        matchId: data.matchId,
        status,
      },
      update: { status },
    });

    return NextResponse.json({ signup }, { status: 201 });
  } catch {
    return jsonError("Failed to update attendance", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const matchId = new URL(request.url).searchParams.get("matchId");
    if (!matchId) return jsonError("Match ID required", 400);

    const result = await validateMatchAccess(session!.user.id, matchId);
    if ("error" in result && result.error) return result.error;

    await prisma.matchSignup.deleteMany({
      where: { userId: session!.user.id, matchId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Failed to clear attendance response", 500);
  }
}
