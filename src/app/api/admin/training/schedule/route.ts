import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { updateWeeklyTrainingSchedule } from "@/lib/training-schedule-actions";
import { adminTrainingScheduleUpdateSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(
    request,
    adminTrainingScheduleUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const { teamKey, ...schedule } = data;
  const result = await updateWeeklyTrainingSchedule(teamKey, schedule);

  if (!result.ok) {
    return jsonError(result.error, 404);
  }

  return NextResponse.json({ session: result.session });
}
