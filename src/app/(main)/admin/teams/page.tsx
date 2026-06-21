import { prisma } from "@/lib/prisma";
import { TeamsManager } from "@/components/admin/TeamsManager";

export const metadata = {
  title: "Admin · Teams",
};

export default async function AdminTeamsPage() {
  const teams = await prisma.clubTeam.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return <TeamsManager initialTeams={teams} />;
}
