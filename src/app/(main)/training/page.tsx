import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  NoTrainingTeamAssigned,
  TeamTrainingMonthView,
} from "@/components/training/TeamTrainingMonthView";
import { getUserEventAttendanceStatuses } from "@/lib/training-attendance";
import {
  getMonthlyTeamTrainingEvents,
  getTrainingTeamByKey,
  getTrainingSquads,
  getUserTrainingTeamKey,
  parseTrainingMonthParam,
} from "@/lib/training-teams";

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

  const { events } = await getMonthlyTeamTrainingEvents(trainingTeamKey, month);
  const attendanceMap = await getUserEventAttendanceStatuses(
    session.user.id,
    events.map((event) => event.id),
  );

  return (
    <TeamTrainingMonthView
      team={team}
      month={month}
      events={events.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate.toISOString(),
      }))}
      attendanceByEventId={Object.fromEntries(attendanceMap)}
    />
  );
}
