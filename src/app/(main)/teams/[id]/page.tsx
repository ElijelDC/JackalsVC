import { notFound } from "next/navigation";
import { TeamDetailView } from "@/components/teams/TeamDetailView";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await prisma.clubTeam.findUnique({ where: { id } });
  return { title: team?.name ?? "Team" };
}

export default async function TeamDetailPage({
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

  return <TeamDetailView team={team} />;
}
