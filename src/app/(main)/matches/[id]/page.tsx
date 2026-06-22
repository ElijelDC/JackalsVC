import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/auth";
import { MatchDetailView } from "@/components/matches/MatchDetailView";
import { hasAttendanceAccess } from "@/lib/membership";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/matches");
  }

  const { id } = await params;
  const detail = await getMatchDetail(id, session.user.id);
  const canAccessAttendance = await hasAttendanceAccess(session.user);
  const monthParam = formatTrainingMonthParam(new Date(detail.match.matchStart));

  return (
    <MatchDetailView
      detail={detail}
      canAccessAttendance={canAccessAttendance}
      monthParam={monthParam}
    />
  );
}
