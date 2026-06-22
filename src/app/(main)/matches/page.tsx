import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  NoMatchTeamAssigned,
  TeamMatchesMonthView,
} from "@/components/matches/TeamMatchesMonthView";
import { getUserMatchAttendanceStatuses } from "@/lib/match-attendance";
import { getMonthlyTeamMatches, resolveMatchesMonth } from "@/lib/matches";
import {
  getTrainingTeamByKey,
  getUserTrainingTeamKey,
} from "@/lib/training-teams";

export const metadata = {
  title: "Matches",
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/matches");
  }

  const { month: monthParam } = await searchParams;
  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);

  if (!trainingTeamKey) {
    return <NoMatchTeamAssigned />;
  }

  const team = getTrainingTeamByKey(trainingTeamKey);
  if (!team) {
    return <NoMatchTeamAssigned />;
  }

  const month = await resolveMatchesMonth(trainingTeamKey, monthParam);
  const matches = await getMonthlyTeamMatches(trainingTeamKey, month);
  const attendanceMap = await getUserMatchAttendanceStatuses(
    session.user.id,
    matches.map((match) => match.id),
  );

  return (
    <TeamMatchesMonthView
      team={team}
      month={month}
      matches={matches.map((match) => ({
        id: match.id,
        opponentName: match.opponentName,
        venue: match.venue,
        location: match.location,
        warmUpTime: match.warmUpTime.toISOString(),
        matchStart: match.matchStart.toISOString(),
      }))}
      attendanceByMatchId={Object.fromEntries(attendanceMap)}
    />
  );
}
