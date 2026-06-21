import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";
import { SessionListPage } from "@/components/training/SessionListPage";

export const metadata = {
  title: "Training Times",
};

export default async function TrainingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/training");
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { category: SESSION_CATEGORIES.WEEKLY },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return (
    <SessionListPage
      sessions={sessions}
      detailBasePath="/training"
      title="Training Times"
      description="Weekly recurring sessions for members. Paid membership is required to register session attendance via Reclub."
      emptyTitle="No sessions scheduled yet"
      emptyDescription="Training times will be posted here soon. Check back later."
    />
  );
}
