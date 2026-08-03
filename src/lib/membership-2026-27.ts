export const MEMBERSHIP_SEASON_LABEL = "October 2026 – May 2027";

export const KIT_FEE_EUR = 50;

/** Matches payment schedules on the member checkout. */
export const MEMBERSHIP_PAYMENT_OPTIONS = [
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

export type MembershipTeamFee202627 = {
  id: string;
  team: string;
  league: string;
  trainingNight: string;
  adultFee: number;
  studentFee: number;
  homeMatches: number;
};

export const MEMBERSHIP_TEAM_FEES_2026_27: MembershipTeamFee202627[] = [
  {
    id: "d2-men",
    team: "Division 2 Men",
    league: "National League",
    trainingNight: "Friday · Meakstown",
    adultFee: 360,
    studentFee: 315,
    homeMatches: 7,
  },
  {
    id: "d3-women",
    team: "Division 3 Women",
    league: "National League",
    trainingNight: "Monday · Meakstown",
    adultFee: 360,
    studentFee: 315,
    homeMatches: 7,
  },
  {
    id: "regional-men",
    team: "Regional Men",
    league: "Regional League",
    trainingNight: "Wednesday · Meakstown",
    adultFee: 320,
    studentFee: 275,
    homeMatches: 4,
  },
];

export const MEMBERSHIP_INCLUDES = [
  "Your team's weekly training — one night per week",
  "Home matchday costs when the club hosts at Luttrellstown",
  "Coached sessions for your squad through the league season",
  "Structured league volleyball Oct–May — hall, coach, and fixtures",
  "Reduced member pricing on club fun sessions",
] as const;

export const MEMBERSHIP_EXCLUDES = [
  `Club kit (€${KIT_FEE_EUR} — buy before membership opens)`,
  "Volleyball Ireland League License",
  "Tournament entries",
  "Extra training beyond your team's weekly night",
] as const;

export function formatMembershipEuro(amount: number) {
  return `€${amount.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
}
