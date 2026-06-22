import { prisma } from "@/lib/prisma";
import { TeamsManager } from "@/components/admin/TeamsManager";
import { getTrainingSquads } from "@/lib/training-squads";

export const metadata = {
  title: "Admin · Teams",
};

export default async function AdminTeamsPage() {
  const [teams, trainingSquads] = await Promise.all([
    prisma.clubTeam.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    getTrainingSquads({ includeInactive: true }),
  ]);

  return (
    <TeamsManager initialTeams={teams} trainingSquads={trainingSquads} />
  );
}
