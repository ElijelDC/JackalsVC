import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { TrainingSessionDetailView } from "@/components/training/TrainingSessionDetailView";
import { hasAttendanceAccess } from "@/lib/membership";
import { getTrainingSessionDetail } from "@/lib/training-attendance";
import { formatTrainingMonthParam } from "@/lib/training-teams-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) return { title: "Training session" };
    const detail = await getTrainingSessionDetail(eventId, session.user.id);
    return {
      title: `${format(new Date(detail.event.startDate), "d MMM")} · ${detail.team.name}`,
    };
  } catch {
    return { title: "Training session" };
  }
}

export default async function TrainingSessionPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/training");
  }

  const { eventId } = await params;
  const detail = await getTrainingSessionDetail(eventId, session.user.id);
  const canAccessAttendance = await hasAttendanceAccess(session.user);
  const monthParam = formatTrainingMonthParam(new Date(detail.event.startDate));

  return (
    <TrainingSessionDetailView
      detail={detail}
      canAccessAttendance={canAccessAttendance}
      monthParam={monthParam}
    />
  );
}
