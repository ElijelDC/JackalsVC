import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Target,
  Trophy,
  Users,
  Volleyball,
  Zap,
} from "lucide-react";

export const TRIALS_BENEFITS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Trophy,
    title: "National League pathway",
    description:
      "Trial for our Men's Division 2, Men's Division 3, and Women's Division 3 squads competing in the Irish National League.",
  },
  {
    icon: Volleyball,
    title: "Full-court training",
    description:
      "No half-court limits — train on a full court every session. Main trainings are at Meakstown Community Centre (brand new, opened 2024), with extra training and matchdays at Luttrellstown Community Centre (modern, opened 2019).",
  },
  {
    icon: Users,
    title: "Club community",
    description:
      "Join a welcoming Dublin volleyball club that values effort, respect, and high standards on and off the court.",
  },
  {
    icon: CalendarDays,
    title: "August 2026 trials",
    description:
      "We're opening trials this August — register your interest so we can share dates, venues, and next steps.",
  },
  {
    icon: Target,
    title: "Clear selection process",
    description:
      "Tell us your experience, preferred positions, and which team you're aiming for so coaches can assess fit.",
  },
  {
    icon: Zap,
    title: "Ready for the season",
    description:
      "Successful trialists join squad plans ahead of the National League season with coaching and club support.",
  },
];

export const TRIALS_LOOKING_FOR = [
  "Experienced, competitive players ready to push for a squad place",
  "Players ready to commit to National League training and matches",
  "Athletes ready to help push Jackals toward promotion — hungry to climb the table",
  "Strong attitude, coachability, and respect for teammates",
] as const;

export const TRIALS_TEAM_OPTIONS = [
  {
    value: "MENS_DIVISION_2",
    label: "Men's Division 2",
    shortDivision: "Division 2",
    accent: "red",
  },
  {
    value: "MENS_DIVISION_3",
    label: "Men's Division 3",
    shortDivision: "Division 3",
    accent: "grey",
  },
  {
    value: "WOMENS_DIVISION_3",
    label: "Women's Division 3",
    shortDivision: "Division 3",
    accent: "purple",
  },
] as const;

export type TrialsTeamOption = (typeof TRIALS_TEAM_OPTIONS)[number]["value"];

/** Any VLY Ireland INL division selection that means they played (not None). */
export function trialsPlayedInlDivision(value: string) {
  return value !== "" && value !== "NONE";
}

export const TRIALS_INL_DIVISION_OPTIONS = [
  { value: "PREMIER", label: "Premier" },
  { value: "DIVISION_1", label: "Division 1" },
  { value: "DIVISION_2", label: "Division 2" },
  { value: "DIVISION_3", label: "Division 3" },
  { value: "OTHER", label: "Other" },
  { value: "NONE", label: "None" },
] as const;

export type TrialsInlDivisionOption =
  (typeof TRIALS_INL_DIVISION_OPTIONS)[number]["value"];

export const TRIALS_POSITION_OPTIONS = [
  { value: "WING", label: "Wing" },
  { value: "OPPO", label: "Oppo" },
  { value: "MIDDLE", label: "Middle" },
  { value: "SETTER", label: "Setter" },
  { value: "LIBERO", label: "Libero" },
] as const;

export type TrialsPositionOption =
  (typeof TRIALS_POSITION_OPTIONS)[number]["value"];

export function trialsTeamLabel(value: string) {
  return (
    TRIALS_TEAM_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}

export function trialsInlDivisionLabel(value: string) {
  return (
    TRIALS_INL_DIVISION_OPTIONS.find((option) => option.value === value)
      ?.label ?? value
  );
}

export function trialsPositionLabel(value: string) {
  return (
    TRIALS_POSITION_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
