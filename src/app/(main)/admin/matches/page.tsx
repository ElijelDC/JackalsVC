import { prisma } from "@/lib/prisma";
import { MatchesManager } from "@/components/admin/MatchesManager";
import { getTrainingSquads } from "@/lib/training-squads";

export const metadata = {
  title: "Admin · Matches",
};

export default async function AdminMatchesPage() {
  const [matches, trainingSquads] = await Promise.all([
    prisma.teamMatch.findMany({
      orderBy: { matchStart: "asc" },
    }),
    getTrainingSquads({ includeInactive: true }),
  ]);

  return (
    <MatchesManager
      initialMatches={matches.map((match) => ({
        id: match.id,
        trainingTeamKey: match.trainingTeamKey,
        opponentName: match.opponentName,
        venue: match.venue,
        location: match.location,
        warmUpTime: match.warmUpTime.toISOString(),
        matchStart: match.matchStart.toISOString(),
        notes: match.notes,
      }))}
      trainingSquads={trainingSquads}
    />
  );
}
