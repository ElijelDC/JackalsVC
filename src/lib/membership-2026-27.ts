export const MEMBERSHIP_SEASON_LABEL = "October 2026 – May 2027";

export const KIT_FEE_EUR = 50;

/** Matches payment schedules on the member checkout. */
export const MEMBERSHIP_PAYMENT_OPTIONS = [
  {
    id: "monthly",
    label: "Monthly",
    summary: "Oct–May",
    description:
      "Spread the season total across the league year — pay each month instead of all at once.",
  },
  {
    id: "installments",
    label: "3 instalments",
    summary: "Oct · Jan · Mar",
    description:
      "Three payments due on the first Monday of October, January, and March.",
  },
  {
    id: "full",
    label: "Pay in full",
    summary: "One payment",
    description: "Pay the full season fee upfront when you register.",
  },
] as const;

export type MembershipTeam202627 = {
  id: string;
  name: string;
  league: string;
  trainingNight: string;
  venue: string;
  sessions: number;
  homeMatches: number;
  adultFee: number;
  studentFee: number;
};

export const MEMBERSHIP_TEAMS_2026_27: MembershipTeam202627[] = [
  {
    id: "d2-men",
    name: "Division 2 Men",
    league: "National League",
    trainingNight: "Friday",
    venue: "Meakstown",
    sessions: 33,
    homeMatches: 7,
    adultFee: 385,
    studentFee: 330,
  },
  {
    id: "d3-women",
    name: "Division 3 Women",
    league: "National League",
    trainingNight: "Monday",
    venue: "Meakstown",
    sessions: 29,
    homeMatches: 7,
    adultFee: 385,
    studentFee: 330,
  },
  {
    id: "regional-men",
    name: "Regional Men",
    league: "Regional League",
    trainingNight: "Wednesday",
    venue: "Meakstown",
    sessions: 31,
    homeMatches: 4,
    adultFee: 345,
    studentFee: 295,
  },
];

export const MEMBERSHIP_INCLUDES = [
  "Your team's weekly training — one night per week at Meakstown",
  "Home matchday costs when your squad hosts at Luttrellstown",
  "Coached sessions for your squad through the league season",
  "Structured league volleyball Oct–May — hall, coach, and fixtures",
] as const;

export const MEMBERSHIP_EXCLUDES = [
  `Club kit (€${KIT_FEE_EUR} — buy before membership opens)`,
  "Cups, playoffs, and extra training",
  "Volleyball Ireland affiliation (handled separately by the club)",
] as const;

export function formatMembershipEuro(amount: number) {
  return `€${amount.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
}
