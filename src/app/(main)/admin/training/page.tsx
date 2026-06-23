import { endOfMonth, startOfMonth } from "date-fns";
import { AdminWeeklyTrainingEditor } from "@/components/admin/AdminWeeklyTrainingEditor";
import { getCoachTrainingSessionsForTeam } from "@/lib/training-coach-sessions";
import { getTrainingSquads } from "@/lib/training-squads";
import {
  formatTrainingMonthParam,
  isAllMonthsParam,
  parseScheduleMonthParam,
} from "@/lib/training-teams-config";
import {
  SESSION_CATEGORIES,
  SESSION_MANAGER_CONFIG,
} from "@/lib/training-utils";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin · Training",
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

export default async function AdminTrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; month?: string }>;
}) {
  const { team: teamParam, month: monthParamRaw } = await searchParams;
  const { mode, month } = parseScheduleMonthParam(monthParamRaw);
  const monthParam =
    monthParamRaw && (isAllMonthsParam(monthParamRaw) || monthParamRaw.match(/^\d{4}-\d{2}$/))
      ? monthParamRaw
      : formatTrainingMonthParam(month);

  const [squads, sessions] = await Promise.all([
    getTrainingSquads({ includeInactive: true }),
    prisma.trainingSession.findMany({
      where: { category: SESSION_CATEGORIES.WEEKLY },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const activeSquads = squads.filter((squad) => squad.key);
  const sessionByTeam = new Map(
    sessions
      .filter((session) => session.trainingTeamKey)
      .map((session) => [session.trainingTeamKey!, session]),
  );

  const selectedTeamKey =
    teamParam && activeSquads.some((squad) => squad.key === teamParam)
      ? teamParam
      : activeSquads.find((squad) => sessionByTeam.has(squad.key))?.key ??
        activeSquads[0]?.key ??
        "";

  const session = selectedTeamKey
    ? sessionByTeam.get(selectedTeamKey) ?? null
    : null;

  let monthSessions: Awaited<
    ReturnType<typeof getCoachTrainingSessionsForTeam>
  > = [];

  if (session && selectedTeamKey) {
    const allSessions = await getCoachTrainingSessionsForTeam(
      selectedTeamKey,
      session.id,
    );
    monthSessions =
      mode === "all" ? allSessions : filterSessionsForMonth(allSessions, month);
  }

  const config = SESSION_MANAGER_CONFIG.WEEKLY;

  return (
    <AdminWeeklyTrainingEditor
      squads={activeSquads}
      selectedTeamKey={selectedTeamKey}
      session={
        session
          ? {
              id: session.id,
              title: session.title,
              dayOfWeek: session.dayOfWeek,
              startTime: session.startTime,
              endTime: session.endTime,
              location: session.location,
            }
          : null
      }
      monthSessions={monthSessions}
      monthParam={monthParam}
      sectionTitle={config.sectionTitle}
      sectionDescription={config.sectionDescription}
    />
  );
}
