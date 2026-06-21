import { prisma } from "@/lib/prisma";
import { TrainingManager } from "@/components/admin/TrainingManager";

export const metadata = {
  title: "Admin · Training",
};

export default async function AdminTrainingPage() {
  const sessions = await prisma.trainingSession.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const serialized = sessions.map((s) => ({
    ...s,
    recurring: s.recurring ?? true,
    recurrenceWeeks: s.recurrenceWeeks ?? 1,
    recurringFrom: s.recurringFrom?.toISOString() ?? null,
    recurringTo: s.recurringTo?.toISOString() ?? null,
    sessionDate: s.sessionDate?.toISOString() ?? null,
  }));

  return <TrainingManager initialSessions={serialized} />;
}
