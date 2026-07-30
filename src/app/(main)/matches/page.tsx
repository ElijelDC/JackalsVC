import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  NoMatchTeamAssigned,
  TeamMatchesMonthView,
} from "@/components/matches/TeamMatchesMonthView";
import { getUserMatchAttendanceStatuses } from "@/lib/match-attendance";
import {
  getMonthlyMatchesForTeams,
  resolveMatchesMonth,
} from "@/lib/matches";
import { resolveCoachAttendanceStatus } from "@/lib/training-attendance-config";
import {
  getTrainingTeamByKey,
  getTrainingSquads,
  getUserTrainingTeamKeys,
} from "@/lib/training-teams";

export const metadata = {
  title: "Matches",
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

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; team?: string; from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/matches");
  }

  const { month: monthParam, team: teamParam, from } = await searchParams;
  const availableKeys = await getUserTrainingTeamKeys(session.user.id);

  if (availableKeys.length === 0) {
    const squads = await getTrainingSquads();
    return <NoMatchTeamAssigned squads={squads} />;
  }

  const selectedKeys = resolveSelectedTeamKeys(availableKeys, teamParam);
  const availableTeams = (
    await Promise.all(availableKeys.map((key) => getTrainingTeamByKey(key)))
  ).filter((team): team is NonNullable<typeof team> => Boolean(team));

  if (availableTeams.length === 0) {
    const squads = await getTrainingSquads();
    return <NoMatchTeamAssigned squads={squads} />;
  }

  const month = await resolveMatchesMonth(selectedKeys, monthParam);
  const matches = await getMonthlyMatchesForTeams(selectedKeys, month);
  const attendanceMap = await getUserMatchAttendanceStatuses(
    session.user.id,
    matches.map((match) => match.id),
  );
  const attendanceByMatchId = Object.fromEntries(
    matches.map((match) => {
      const raw = attendanceMap.get(match.id) ?? "UNANSWERED";
      const status = session.user.isCoach
        ? resolveCoachAttendanceStatus(raw, match.matchStart)
        : raw;
      return [match.id, status];
    }),
  );
  const teamNameByKey = new Map(availableTeams.map((team) => [team.key, team.name]));
  const singleKey = selectedKeys.length === 1 ? selectedKeys[0]! : null;
  const singleTeam = singleKey
    ? availableTeams.find((team) => team.key === singleKey) ?? null
    : null;

  return (
    <TeamMatchesMonthView
      team={singleTeam}
      teams={availableTeams}
      selectedTeamKey={singleKey}
      month={month}
      isCoach={session.user.isCoach}
      returnFrom={from ?? null}
      matches={matches.map((match) => ({
        id: match.id,
        opponentName: match.opponentName,
        venue: match.venue,
        location: match.location,
        warmUpTime: match.warmUpTime.toISOString(),
        matchStart: match.matchStart.toISOString(),
        cancelled: match.cancelled,
        trainingTeamKey: match.trainingTeamKey,
        teamName: teamNameByKey.get(match.trainingTeamKey) ?? match.trainingTeamKey,
      }))}
      attendanceByMatchId={attendanceByMatchId}
    />
  );
}
