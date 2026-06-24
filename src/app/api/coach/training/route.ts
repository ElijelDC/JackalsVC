import { NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  getWeeklyTrainingSessionForTeam,
  updateWeeklyTrainingSchedule,
  createWeeklyTrainingSession,
} from "@/lib/training-schedule-actions";
import { serializeTrainingSession } from "@/lib/training-utils";
import { coachTrainingUpdateSchema } from "@/lib/validations";

export async function GET() {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const session = await getWeeklyTrainingSessionForTeam(coach!.trainingTeamKey);

  if (!session) {
    return jsonError("No training session found for your squad", 404);
  }

  return NextResponse.json({
    session: serializeTrainingSession(session),
    teamName: coach!.teamName,
  });
}

export async function PATCH(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    coachTrainingUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await getWeeklyTrainingSessionForTeam(coach!.trainingTeamKey);

  let result;
  if (existing) {
    result = await updateWeeklyTrainingSchedule(coach!.trainingTeamKey, data);
  } else {
    result = await createWeeklyTrainingSession(coach!.trainingTeamKey, data);
  }

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ session: result.session });
}
