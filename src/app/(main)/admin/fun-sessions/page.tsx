import { prisma } from "@/lib/prisma";
import { TrainingManager } from "@/components/admin/TrainingManager";
import {
  serializeTrainingSession,
  SESSION_CATEGORIES,
  SESSION_MANAGER_CONFIG,
} from "@/lib/training-utils";

export const metadata = {
  title: "Admin · Fun sessions",
};

export default async function AdminFunSessionsPage() {
  const sessions = await prisma.trainingSession.findMany({
    where: { category: SESSION_CATEGORIES.FUN },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <TrainingManager
      initialSessions={sessions.map(serializeTrainingSession)}
      config={SESSION_MANAGER_CONFIG.FUN}
    />
  );
}
