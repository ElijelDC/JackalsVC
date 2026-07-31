import { endOfMonth, startOfMonth } from "date-fns";
import { CoachWeeklyTrainingEditor } from "@/components/coach/CoachWeeklyTrainingEditor";
import { requireCoachPage, resolveCoachWriteTeamKey } from "@/lib/coach-auth";
import { getCoachTrainingSessionsForTeam } from "@/lib/training-coach-sessions";
import {
  formatTrainingMonthParam,
  isAllMonthsParam,
  parseScheduleMonthParam,
} from "@/lib/training-teams-config";
import { SESSION_CATEGORIES, serializeTrainingSession } from "@/lib/training-utils";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Coach · Training times",
};

function filterSessionsForMonth<T extends { startDate: string }>(
  sessions: T[],
  month: Date,
) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return sessions.filter((session) => {
    const date = new Date(session.startDate);
    return date >= monthStart && date <= monthEnd;
  });
}

export default async function CoachTrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; month?: string }>;
}) {
  const { coach } = await requireCoachPage();
  const { team: teamParam, month: monthParamRaw } = await searchParams;
  const { mode, month } = parseScheduleMonthParam(monthParamRaw);
  const monthParam =
    monthParamRaw && (isAllMonthsParam(monthParamRaw) || monthParamRaw.match(/^\d{4}-\d{2}$/))
      ? monthParamRaw
      : formatTrainingMonthParam(month);

  const selectedTeamKey = resolveCoachWriteTeamKey(coach, teamParam);

  const session = await prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey: selectedTeamKey,
    },
  });

  let monthSessions: Awaited<
    ReturnType<typeof getCoachTrainingSessionsForTeam>
  > = [];

  if (session) {
    const allSessions = await getCoachTrainingSessionsForTeam(
      selectedTeamKey,
      session.id,
    );
    monthSessions =
      mode === "all" ? allSessions : filterSessionsForMonth(allSessions, month);
  }

  const serialized = session ? serializeTrainingSession(session) : null;

  return (
    <CoachWeeklyTrainingEditor
      teams={coach.teams}
      selectedTeamKey={selectedTeamKey}
      session={
        serialized
          ? {
              id: serialized.id,
              title: serialized.title,
              dayOfWeek: serialized.dayOfWeek,
              startTime: serialized.startTime,
              endTime: serialized.endTime,
              location: serialized.location,
              recurringFrom: serialized.recurringFrom,
              recurringTo: serialized.recurringTo,
            }
          : null
      }
      monthSessions={monthSessions}
      monthParam={monthParam}
    />
  );
}
