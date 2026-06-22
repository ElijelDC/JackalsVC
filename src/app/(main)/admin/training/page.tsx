import { prisma } from "@/lib/prisma";
import { TrainingManager } from "@/components/admin/TrainingManager";
import { getTrainingSquads } from "@/lib/training-squads";
import {
  serializeTrainingSession,
  SESSION_CATEGORIES,
  SESSION_MANAGER_CONFIG,
} from "@/lib/training-utils";

export const metadata = {
  title: "Admin · Training",
};

export default async function AdminTrainingPage() {
  const [sessions, trainingSquads] = await Promise.all([
    prisma.trainingSession.findMany({
      where: { category: SESSION_CATEGORIES.WEEKLY },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    getTrainingSquads({ includeInactive: true }),
  ]);

  return (
    <TrainingManager
      initialSessions={sessions.map(serializeTrainingSession)}
      config={SESSION_MANAGER_CONFIG.WEEKLY}
      trainingSquads={trainingSquads}
    />
  );
}
