import { AchievementsShowcase } from "@/components/achievements/AchievementsShowcase";
import { pageMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const metadata = pageMetadata({
  title: "Club Achievements",
  description:
    "Tournament wins and milestones from Jackals Volleyball Club — Irish National League and volleyball achievements in Dublin.",
  path: "/achievements",
});

export default async function AchievementsPage() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return <AchievementsShowcase achievements={achievements} />;
}
