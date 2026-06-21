import { notFound } from "next/navigation";
import { TeamEditor } from "@/components/admin/TeamEditor";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await prisma.clubTeam.findUnique({ where: { id } });
  return { title: team ? `Admin · ${team.name}` : "Admin · Team" };
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

  return <TeamEditor initialTeam={team} />;
}
