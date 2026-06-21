import { TeamsShowcase } from "@/components/teams/TeamsShowcase";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Our Teams",
};

export default async function TeamsPage() {
  const teams = await prisma.clubTeam.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      members: {
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          role: true,
          photoUrl: true,
        },
      },
    },
  });

  return <TeamsShowcase teams={teams} />;
}
