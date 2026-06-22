import {
  addMonths,
  format,
  isValid,
  parse,
  startOfMonth,
  subMonths,
} from "date-fns";

export const TRAINING_TEAMS = [
  {
    key: "DIV2_MENS",
    name: "Division 2 Mens",
    dayOfWeek: 4,
    dayLabel: "Thursday",
  },
  {
    key: "DIV3_WOMENS",
    name: "Division 3 Womens",
    dayOfWeek: 1,
    dayLabel: "Monday",
  },
  {
    key: "DIV4_MENS",
    name: "Division 4 Mens",
    dayOfWeek: 3,
    dayLabel: "Wednesday",
  },
] as const;

export type TrainingTeamKey = (typeof TRAINING_TEAMS)[number]["key"];

export type TrainingTeam = (typeof TRAINING_TEAMS)[number];

export function getTrainingTeamByKey(key: string | null | undefined) {
  return TRAINING_TEAMS.find((team) => team.key === key) ?? null;
}

export function isTrainingTeamKey(value: string): value is TrainingTeamKey {
  return TRAINING_TEAMS.some((team) => team.key === value);
}

export function parseTrainingMonthParam(value: string | undefined) {
  if (!value) return startOfMonth(new Date());

  const parsed = parse(value, "yyyy-MM", new Date());
  return isValid(parsed) ? startOfMonth(parsed) : startOfMonth(new Date());
}

export function formatTrainingMonthParam(month: Date) {
  return format(month, "yyyy-MM");
}

export function getAdjacentTrainingMonths(month: Date) {
  return {
    previous: subMonths(month, 1),
    next: addMonths(month, 1),
  };
}
