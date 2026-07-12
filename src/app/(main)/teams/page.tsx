import { TeamsShowcase } from "@/components/teams/TeamsShowcase";
import { pageMetadata, SEO_COPY } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const metadata = pageMetadata({
  title: "Our Teams",
  description: SEO_COPY.teamsIntro,
  path: "/teams",
});

export const revalidate = 3600;

export default async function TeamsPage() {
  const teams = await prisma.clubTeam.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      members: {
        where: { hidden: false },
        orderBy: [{ role: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          role: true,
          photoUrl: true,
          clubMemberId: true,
        },
      },
    },
  });

  return <TeamsShowcase teams={teams} />;
}
