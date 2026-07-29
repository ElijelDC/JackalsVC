import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  NoTrainingTeamAssigned,
  TeamTrainingMonthView,
} from "@/components/training/TeamTrainingMonthView";
import { getUserEventAttendanceStatuses } from "@/lib/training-attendance";
import { enrichEventRecords } from "@/lib/event-enrichment";
import { resolveCoachEventAttendanceStatus } from "@/lib/training-attendance-config";
import {
  getMonthlyTrainingEventsForTeams,
  getTrainingTeamByKey,
  getTrainingSquads,
  getUserTrainingTeamKeys,
  parseTrainingMonthParam,
} from "@/lib/training-teams";
import { dayLabelFromDayOfWeek } from "@/lib/training-squads";

export const metadata = {
  title: "Training sign-ups",
};

function resolveSelectedTeamKeys(
  availableKeys: string[],
  teamParam: string | null | undefined,
) {
  const raw = teamParam?.trim() ?? "";
  if (availableKeys.length <= 1) return availableKeys;
  if (raw && availableKeys.includes(raw)) return [raw];
  return availableKeys;
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; team?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/training");
  }

  const { month: monthParam, team: teamParam } = await searchParams;
  const month = parseTrainingMonthParam(monthParam);
  const availableKeys = await getUserTrainingTeamKeys(session.user.id);

  if (availableKeys.length === 0) {
    const squads = await getTrainingSquads();
    return <NoTrainingTeamAssigned squads={squads} />;
  }

  const selectedKeys = resolveSelectedTeamKeys(availableKeys, teamParam);
  const availableTeams = (
    await Promise.all(availableKeys.map((key) => getTrainingTeamByKey(key)))
  ).filter((team): team is NonNullable<typeof team> => Boolean(team));

  if (availableTeams.length === 0) {
    const squads = await getTrainingSquads();
    return <NoTrainingTeamAssigned squads={squads} />;
  }

  const { results, events } = await getMonthlyTrainingEventsForTeams(
    selectedKeys,
    month,
  );
  const attendanceMap = await getUserEventAttendanceStatuses(
    session.user.id,
    events.map((event) => event.id),
  );
  const enrichedEvents = await enrichEventRecords(events);
  const attendanceByEventId = Object.fromEntries(
    enrichedEvents.map((event) => [
      event.id,
      resolveCoachEventAttendanceStatus(
        event.id,
        attendanceMap,
        event.startDate,
        session.user.isCoach,
      ),
    ]),
  );
  const teamNameByKey = new Map(availableTeams.map((team) => [team.key, team.name]));
  const teamKeyByEventId = new Map(
    events.map((event) => [event.id, event.trainingTeamKey]),
  );

  const singleKey = selectedKeys.length === 1 ? selectedKeys[0]! : null;
  const singleResult = singleKey
    ? results.find((result) => result.trainingTeamKey === singleKey)
    : null;
  const singleTeam = singleKey
    ? availableTeams.find((team) => team.key === singleKey) ?? null
    : null;

  const displayTeam =
    singleTeam && singleResult?.session
      ? {
          ...singleTeam,
          dayOfWeek: singleResult.session.dayOfWeek,
          dayLabel: dayLabelFromDayOfWeek(singleResult.session.dayOfWeek),
        }
      : singleTeam;

  return (
    <TeamTrainingMonthView
      team={displayTeam}
      teams={availableTeams}
      selectedTeamKey={singleKey}
      month={month}
      isCoach={session.user.isCoach}
      sessionTimes={
        singleResult?.session
          ? {
              startTime: singleResult.session.startTime,
              endTime: singleResult.session.endTime,
            }
          : null
      }
      events={enrichedEvents.map((event) => {
        const trainingTeamKey =
          teamKeyByEventId.get(event.id) ?? singleKey ?? "";
        return {
          id: event.id,
          title: event.title,
          startDate: event.startDate.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
          cancelled: event.occurrenceCancelled,
          trainingTeamKey,
          teamName: teamNameByKey.get(trainingTeamKey) ?? trainingTeamKey,
        };
      })}
      attendanceByEventId={attendanceByEventId}
    />
  );
}
