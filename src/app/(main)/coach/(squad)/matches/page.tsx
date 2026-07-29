import { endOfMonth, startOfMonth } from "date-fns";
import { CoachMatchesManager } from "@/components/coach/CoachMatchesManager";
import {
  serializeTeamMatch,
  type TeamMatchItem,
} from "@/components/coach/match-form-utils";
import { requireCoachPage } from "@/lib/coach-auth";
import { getAllTeamMatches } from "@/lib/matches";
import {
  formatTrainingMonthParam,
  isAllMonthsParam,
  parseScheduleMonthParam,
} from "@/lib/training-teams-config";

export const metadata = {
  title: "Coach · Matches",
};

function filterMatchesForMonth(matches: TeamMatchItem[], month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return matches.filter((match) => {
    const date = new Date(match.matchStart);
    return date >= monthStart && date <= monthEnd;
  });
}

export default async function CoachMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { coach } = await requireCoachPage();
  const { month: monthParamRaw } = await searchParams;
  const { mode, month } = parseScheduleMonthParam(monthParamRaw);
  const monthParam =
    monthParamRaw && (isAllMonthsParam(monthParamRaw) || monthParamRaw.match(/^\d{4}-\d{2}$/))
      ? monthParamRaw
      : formatTrainingMonthParam(month);

  const matches = await getAllTeamMatches(coach.trainingTeamKey);
  const allMatches = matches.map(serializeTeamMatch);
  const monthMatches =
    mode === "all" ? allMatches : filterMatchesForMonth(allMatches, month);

  return (
    <CoachMatchesManager
      teamName={coach.teamName}
      trainingTeamKey={coach.trainingTeamKey}
      monthMatches={monthMatches}
      monthParam={monthParam}
    />
  );
}
