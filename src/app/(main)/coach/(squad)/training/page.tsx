import { endOfMonth, startOfMonth } from "date-fns";
import { CoachTrainingEditor } from "@/components/coach/CoachTrainingEditor";
import { requireCoachPage } from "@/lib/coach-auth";
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
  searchParams: Promise<{ month?: string }>;
}) {
  const { coach } = await requireCoachPage();
  const { month: monthParamRaw } = await searchParams;
  const { mode, month } = parseScheduleMonthParam(monthParamRaw);
  const monthParam =
    monthParamRaw && (isAllMonthsParam(monthParamRaw) || monthParamRaw.match(/^\d{4}-\d{2}$/))
      ? monthParamRaw
      : formatTrainingMonthParam(month);

  const session = await prisma.trainingSession.findFirst({
    where: {
      category: SESSION_CATEGORIES.WEEKLY,
      trainingTeamKey: coach.trainingTeamKey,
    },
  });

  if (!session) {
    return (
      <CoachTrainingEditor
        teamName={coach.teamName}
        initialSession={{
          id: "",
          title: coach.teamName,
          dayOfWeek: 2, // Default to Tuesday
          startTime: "19:00",
          endTime: "20:30",
          location: "",
        }}
        monthSessions={[]}
        monthParam={monthParam}
        isCreating={true}
      />
    );
  }

  const serialized = serializeTrainingSession(session);
  const allSessions = await getCoachTrainingSessionsForTeam(
    coach.trainingTeamKey,
    session.id,
  );
  const monthSessions =
    mode === "all" ? allSessions : filterSessionsForMonth(allSessions, month);

  return (
    <CoachTrainingEditor
      teamName={coach.teamName}
      initialSession={{
        id: serialized.id,
        title: serialized.title,
        dayOfWeek: serialized.dayOfWeek,
        startTime: serialized.startTime,
        endTime: serialized.endTime,
        location: serialized.location,
        recurringFrom: serialized.recurringFrom,
        recurringTo: serialized.recurringTo,
      }}
      monthSessions={monthSessions}
      monthParam={monthParam}
    />
  );
}
