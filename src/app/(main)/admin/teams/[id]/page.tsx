import { notFound } from "next/navigation";
import { TeamEditor } from "@/components/admin/TeamEditor";
import { prisma } from "@/lib/prisma";
import { syncClubTeamFromRoster } from "@/lib/club-team-roster-sync";
import { getTrainingSquads } from "@/lib/training-squads";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await prisma.clubTeam.findUnique({ where: { id } });
  return { title: team ? `Admin · Manage team · ${team.name}` : "Admin · Manage team" };
}

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.clubTeam.findUnique({
    where: { id },
    include: {
      members: {
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!team) {
    notFound();
  }

  if (team.trainingTeamKey) {
    await syncClubTeamFromRoster(team.id);
  }

  const [refreshedTeam, trainingSquads] = await Promise.all([
    prisma.clubTeam.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    getTrainingSquads({ includeInactive: true }),
  ]);

  if (!refreshedTeam) {
    notFound();
  }

  return (
    <TeamEditor
      initialTeam={refreshedTeam}
      trainingSquads={trainingSquads}
    />
  );
}
