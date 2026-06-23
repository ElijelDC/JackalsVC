import { endOfMonth, startOfMonth } from "date-fns";
import { AdminMatchesEditor } from "@/components/admin/AdminMatchesEditor";
import {
  serializeTeamMatch,
  type TeamMatchItem,
} from "@/components/coach/match-form-utils";
import { getAllTeamMatches } from "@/lib/matches";
import { getTrainingSquads } from "@/lib/training-squads";
import {
  formatTrainingMonthParam,
  isAllMonthsParam,
  parseScheduleMonthParam,
} from "@/lib/training-teams-config";

export const metadata = {
  title: "Admin · Matches",
};

function filterMatchesForMonth(matches: TeamMatchItem[], month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return matches.filter((match) => {
    const date = new Date(match.matchStart);
    return date >= monthStart && date <= monthEnd;
  });
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; month?: string }>;
}) {
  const { team: teamParam, month: monthParamRaw } = await searchParams;
  const { mode, month } = parseScheduleMonthParam(monthParamRaw);
  const monthParam =
    monthParamRaw && (isAllMonthsParam(monthParamRaw) || monthParamRaw.match(/^\d{4}-\d{2}$/))
      ? monthParamRaw
      : formatTrainingMonthParam(month);

  const squads = await getTrainingSquads({ includeInactive: true });
  const activeSquads = squads.filter((squad) => squad.key);

  const selectedTeamKey =
    teamParam && activeSquads.some((squad) => squad.key === teamParam)
      ? teamParam
      : activeSquads[0]?.key ?? "";

  const matches = selectedTeamKey
    ? await getAllTeamMatches(selectedTeamKey)
    : [];
  const allMatches = matches.map(serializeTeamMatch);
  const monthMatches =
    mode === "all" ? allMatches : filterMatchesForMonth(allMatches, month);

  return (
    <AdminMatchesEditor
      squads={activeSquads}
      selectedTeamKey={selectedTeamKey}
      monthMatches={monthMatches}
      monthParam={monthParam}
      sectionTitle="Squad matches"
      sectionDescription="Schedule league and friendly matches per training squad. Members only see matches for their assigned team."
    />
  );
}
