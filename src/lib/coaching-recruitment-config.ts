import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Euro,
  Heart,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

export const COACHING_BENEFITS: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Euro,
    title: "Paid coaching roles",
    description:
      "Compensation for paid coaching positions, depending on your experience, qualifications, and the level of responsibility you take on.",
  },
  {
    icon: Trophy,
    title: "Develop National League squads",
    description:
      "Help shape competitive men's and women's teams in Irish National League structures — on court, in training, and on match day.",
  },
  {
    icon: Users,
    title: "Grow the volleyball community",
    description:
      "Work with players across the club — league members, fun sessions, skills clinics, and people discovering the sport for the first time.",
  },
  {
    icon: CalendarDays,
    title: "Structured club support",
    description:
      "Training schedules, squad management, and match coordination through the Jackals in-house built Web-Application — so you can focus on coaching.",
  },
  {
    icon: Heart,
    title: "Passionate club culture",
    description:
      "Join a welcoming team that values effort, respect, and good vibes — high standards on court with a strong sense of community off it.",
  },
  {
    icon: Sparkles,
    title: "Flexible pathways",
    description:
      "Volunteer and paid coaching routes are available. Tell us what you bring and we'll find the right fit as the club expands.",
  },
];

export const COACHING_LOOKING_FOR = [
  "Passionate, dedicated coaches who love the game",
  "Coaches with at least VLY Ireland Foundation level qualification, or at least experienced coaching volleyball",
  "Support for our National League squads and training programmes",
  "People active in the wider volleyball community who want to make an impact",
  "Experienced coaches or those eager to develop further with the club",
] as const;

export const COACHING_QUALIFICATION_LEVELS = [
  { value: "NONE", label: "None" },
  { value: "FOUNDATION", label: "Foundation" },
  { value: "LEVEL_1", label: "Level 1" },
  { value: "LEVEL_2", label: "Level 2" },
] as const;

export type CoachingQualificationLevel =
  (typeof COACHING_QUALIFICATION_LEVELS)[number]["value"];

export const COACHING_COMMUTE_OPTIONS = [
  { value: "YES", label: "Yes — both venues work for me" },
  { value: "NO", label: "No" },
  { value: "ONE_VENUE", label: "Only one of the venues works for me" },
] as const;

export type CoachingCommuteOption =
  (typeof COACHING_COMMUTE_OPTIONS)[number]["value"];

export function coachingQualificationLabel(value: string) {
  return (
    COACHING_QUALIFICATION_LEVELS.find((level) => level.value === value)
      ?.label ?? value
  );
}

export function coachingCommuteLabel(value: string) {
  return (
    COACHING_COMMUTE_OPTIONS.find((option) => option.value === value)?.label ??
    value
  );
}
