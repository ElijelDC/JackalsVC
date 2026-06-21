import { AchievementsShowcase } from "@/components/achievements/AchievementsShowcase";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Club Achievements",
};

export default async function AchievementsPage() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return <AchievementsShowcase achievements={achievements} />;
}
