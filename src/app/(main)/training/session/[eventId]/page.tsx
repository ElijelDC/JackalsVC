import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { TrainingSessionDetailView } from "@/components/training/TrainingSessionDetailView";
import { resolveDetailBackLink } from "@/lib/dashboard-return";
import { getAttendanceAccessInfo } from "@/lib/membership";
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
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/training");
  }

  const { eventId } = await params;
  const { from } = await searchParams;
  const detail = await getTrainingSessionDetail(eventId, session.user.id);
  const attendanceAccess = await getAttendanceAccessInfo(session.user);
  const monthParam = formatTrainingMonthParam(new Date(detail.event.startDate));
  const backLink = resolveDetailBackLink(from, {
    path: `/training?month=${monthParam}`,
    label: detail.team.name,
  });

  return (
    <TrainingSessionDetailView
      detail={detail}
      canAccessAttendance={attendanceAccess.canAccess}
      attendanceBlockReason={attendanceAccess.blockReason}
      monthParam={monthParam}
      backHref={backLink.path}
      backLabel={backLink.label}
    />
  );
}
