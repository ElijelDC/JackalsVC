import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { MatchDetailView } from "@/components/matches/MatchDetailView";
import { resolveDetailBackLink } from "@/lib/dashboard-return";
import { getAttendanceAccessInfo } from "@/lib/membership";
import { getMatchDetail } from "@/lib/match-attendance";
import { formatTrainingMonthParam } from "@/lib/training-teams-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) return { title: "Match" };
    const detail = await getMatchDetail(id, session.user.id);
    return {
      title: `${format(new Date(detail.match.matchStart), "d MMM")} · ${detail.team.name}`,
    };
  } catch {
    return { title: "Match" };
  }
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/matches");
  }

  const { id } = await params;
  const { from } = await searchParams;
  const detail = await getMatchDetail(id, session.user.id);
  const attendanceAccess = await getAttendanceAccessInfo(session.user);
  const monthParam = formatTrainingMonthParam(new Date(detail.match.matchStart));
  const backLink = resolveDetailBackLink(from, {
    path: `/matches?month=${monthParam}`,
    label: detail.team.name,
  });

  return (
    <MatchDetailView
      detail={detail}
      canAccessAttendance={attendanceAccess.canAccess}
      attendanceBlockReason={attendanceAccess.blockReason}
      monthParam={monthParam}
      backHref={backLink.path}
      backLabel={backLink.label}
    />
  );
}
