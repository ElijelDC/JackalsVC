import { prisma } from "@/lib/prisma";
import { AchievementsManager } from "@/components/admin/AchievementsManager";

export const metadata = {
  title: "Admin · Achievements",
};

export default async function AdminAchievementsPage() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return <AchievementsManager initialAchievements={achievements} />;
}
