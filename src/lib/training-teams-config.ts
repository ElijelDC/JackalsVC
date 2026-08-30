import {
  addMonths,
  format,
  isValid,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns";

export type TrainingTeam = {
  key: string;
  name: string;
  dayOfWeek: number;
  dayLabel: string;
  /** Set for coaches with multiple squads (priority 0 = head, else cover). */
  coachRole?: CoachSquadRole;
};

export type CoachSquadRole = "head" | "cover";

export function getTrainingTeamFromList(
  teams: TrainingTeam[],
  key: string | null | undefined,
) {
  if (!key) return null;
  return teams.find((team) => team.key === key) ?? null;
}

export function parseTrainingMonthParam(value: string | undefined) {
  if (!value) return startOfMonth(new Date());

  const parsed = parse(value, "yyyy-MM", new Date());
  return isValid(parsed) ? startOfMonth(parsed) : startOfMonth(new Date());
}

export function formatTrainingMonthParam(month: Date) {
  return format(month, "yyyy-MM");
}

export const ALL_MONTHS_PARAM = "all";

export function isAllMonthsParam(value: string | undefined) {
  return value === ALL_MONTHS_PARAM;
}

export function parseScheduleMonthParam(value: string | undefined) {
  if (isAllMonthsParam(value)) {
    return { mode: "all" as const, month: startOfMonth(new Date()) };
  }

  return { mode: "month" as const, month: parseTrainingMonthParam(value) };
}

export function getAdjacentTrainingMonths(month: Date) {
  return {
    previous: subMonths(month, 1),
    next: addMonths(month, 1),
  };
}
