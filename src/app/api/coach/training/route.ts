import { NextResponse } from "next/server";
import { coachOwnsTeam, requireCoach, resolveCoachWriteTeamKey } from "@/lib/coach-auth";
import { jsonError, parseJsonBody } from "@/lib/api";
import {
  getWeeklyTrainingSessionForTeam,
  updateWeeklyTrainingSchedule,
  createWeeklyTrainingSession,
} from "@/lib/training-schedule-actions";
import { getTrainingTeamByKey } from "@/lib/training-squads";
import { serializeTrainingSession } from "@/lib/training-utils";
import { adminTrainingScheduleUpdateSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const teamKey = resolveCoachWriteTeamKey(coach!, searchParams.get("team"));

  const session = await getWeeklyTrainingSessionForTeam(teamKey);

  if (!session) {
    return jsonError("No training session found for this squad", 404);
  }

  const team = await getTrainingTeamByKey(teamKey);

  return NextResponse.json({
    session: serializeTrainingSession(session),
    teamName: team?.name ?? coach!.teamName,
  });
}

export async function PATCH(request: Request) {
  const { coach, response } = await requireCoach();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    adminTrainingScheduleUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const { teamKey, ...schedule } = data;

  if (!coachOwnsTeam(coach!, teamKey)) {
    return jsonError("You can only manage training for your assigned squads", 403);
  }

  const existing = await getWeeklyTrainingSessionForTeam(teamKey);

  let result;
  if (existing) {
    result = await updateWeeklyTrainingSchedule(teamKey, schedule);
  } else {
    result = await createWeeklyTrainingSession(teamKey, schedule);
  }

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ session: result.session });
}
