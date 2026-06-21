import { prisma } from "@/lib/prisma";
import { TrainingManager } from "@/components/admin/TrainingManager";

export const metadata = {
  title: "Admin · Training",
};

export default async function AdminTrainingPage() {
  const sessions = await prisma.trainingSession.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return <TrainingManager initialSessions={sessions} />;
}
