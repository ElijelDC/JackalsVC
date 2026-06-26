import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { MatchdaySheetView } from "@/components/matches/MatchdaySheetView";
import { getCoachProfile } from "@/lib/coach-auth";
import { getMatchdaySheet } from "@/lib/matchday-sheet";
import { formatTrainingMonthParam } from "@/lib/training-teams-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  return { title: "Matchday sheet" };
}

export default async function MatchdaySheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/matches");
  }

  const coach = await getCoachProfile(session.user.id);
  if (!coach) {
    redirect("/matches");
  }

  const { id } = await params;
  const data = await getMatchdaySheet(id, session.user.id);
  const monthParam = formatTrainingMonthParam(new Date(data.match.matchStart));

  return (
    <MatchdaySheetView
      data={data}
      downloadUrl={`/api/coach/matches/${id}/matchday-sheet`}
      backHref={`/matches/${id}?month=${monthParam}`}
    />
  );
}
