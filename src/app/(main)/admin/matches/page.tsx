import { prisma } from "@/lib/prisma";
import { MatchesManager } from "@/components/admin/MatchesManager";

export const metadata = {
  title: "Admin · Matches",
};

export default async function AdminMatchesPage() {
  const matches = await prisma.teamMatch.findMany({
    orderBy: { matchStart: "asc" },
  });

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
    />
  );
}
