import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  NoTrainingTeamAssigned,
  TeamTrainingMonthView,
} from "@/components/training/TeamTrainingMonthView";
import { getUserEventAttendanceStatuses } from "@/lib/training-attendance";
import { enrichEventRecords } from "@/lib/event-enrichment";
import {
  getMonthlyTeamTrainingEvents,
  getTrainingTeamByKey,
  getTrainingSquads,
  getUserTrainingTeamKey,
  parseTrainingMonthParam,
} from "@/lib/training-teams";
import { dayLabelFromDayOfWeek } from "@/lib/training-squads";

export const metadata = {
  title: "Training sign-ups",
};

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/training");
  }

  const { month: monthParam } = await searchParams;
  const month = parseTrainingMonthParam(monthParam);
  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);

  if (!trainingTeamKey) {
    const squads = await getTrainingSquads();
    return <NoTrainingTeamAssigned squads={squads} />;
  }

  const team = await getTrainingTeamByKey(trainingTeamKey);
  if (!team) {
    const squads = await getTrainingSquads();
    return <NoTrainingTeamAssigned squads={squads} />;
  }

  const { events, session: trainingSession } = await getMonthlyTeamTrainingEvents(
    trainingTeamKey,
    month,
  );
  const attendanceMap = await getUserEventAttendanceStatuses(
    session.user.id,
    events.map((event) => event.id),
  );
  const enrichedEvents = await enrichEventRecords(events);

  const displayTeam =
    team && trainingSession
      ? {
          ...team,
          dayOfWeek: trainingSession.dayOfWeek,
          dayLabel: dayLabelFromDayOfWeek(trainingSession.dayOfWeek),
        }
      : team;

  return (
    <TeamTrainingMonthView
      team={displayTeam!}
      month={month}
      isCoach={session.user.isCoach}
      sessionTimes={
        trainingSession
          ? { startTime: trainingSession.startTime, endTime: trainingSession.endTime }
          : null
      }
      events={enrichedEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() ?? null,
        cancelled: event.occurrenceCancelled,
      }))}
      attendanceByEventId={Object.fromEntries(attendanceMap)}
    />
  );
}
