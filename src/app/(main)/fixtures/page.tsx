import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  FIXTURES_ALL_TEAMS,
  SeasonFixturesView,
} from "@/components/matches/SeasonFixturesView";
import { getAllMatchesForTeams } from "@/lib/matches";
import {
  getTrainingSquads,
  getUserTrainingTeamKey,
} from "@/lib/training-teams";

export const metadata = {
  title: "Season fixtures",
};

function resolveEffectiveTeamKey(
  teamParam: string | undefined,
  memberTeamKey: string | null,
  availableKeys: string[],
) {
  if (teamParam === undefined) {
    return memberTeamKey ?? FIXTURES_ALL_TEAMS;
  }

  const raw = teamParam.trim();
  if (!raw || raw === FIXTURES_ALL_TEAMS) return FIXTURES_ALL_TEAMS;
  if (availableKeys.includes(raw)) return raw;
  return memberTeamKey ?? FIXTURES_ALL_TEAMS;
}

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; from?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/fixtures");
  }

  const { team: teamParam, from } = await searchParams;
  const squads = await getTrainingSquads();
  const availableKeys = squads.map((squad) => squad.key);
  const memberTeamKey = await getUserTrainingTeamKey(session.user.id);
  const effectiveTeamKey = resolveEffectiveTeamKey(
    teamParam,
    memberTeamKey,
    availableKeys,
  );

  const fetchKeys =
    effectiveTeamKey === FIXTURES_ALL_TEAMS
      ? availableKeys
      : [effectiveTeamKey];

  const matches = await getAllMatchesForTeams(fetchKeys);
  const teamNameByKey = new Map(squads.map((squad) => [squad.key, squad.name]));

  return (
    <SeasonFixturesView
      teams={squads}
      selectedTeamKey={effectiveTeamKey}
      memberTeamKey={memberTeamKey}
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
        teamName:
          teamNameByKey.get(match.trainingTeamKey) ?? match.trainingTeamKey,
      }))}
    />
  );
}
