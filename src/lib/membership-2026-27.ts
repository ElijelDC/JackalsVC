export const MEMBERSHIP_SEASON_LABEL = "October 2026 – April 2027";

export const KIT_FEE_EUR = 45;

export const MEMBERSHIP_FULL_COURT_TRAINING_COPY =
  "Full-court training sessions at Meakstown throughout the season for your squad";

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

export type MembershipLeagueTier202627 = {
  id: string;
  league: string;
  name: string;
  squads: string;
  homeMatches: number;
  adultFee: number;
  studentFee: number;
};

export const MEMBERSHIP_LEAGUE_TIERS_2026_27: MembershipLeagueTier202627[] = [
  {
    id: "national-league",
    league: "National League",
    name: "National League team",
    squads: "Division 2 Men · Division 3 Women",
    homeMatches: 7,
    adultFee: 365,
    studentFee: 320,
  },
  {
    id: "regional-league",
    league: "Regional League",
    name: "Regional League team",
    squads: "Regional Men",
    homeMatches: 4,
    adultFee: 325,
    studentFee: 280,
  },
];

export const MEMBERSHIP_INCLUDES = [
  "Full-court training sessions for your squad through the season",
  "Your team's weekly training — one night per week at Meakstown",
  "Home matchday costs when the club hosts at Luttrellstown",
  "Coached sessions for your squad through the league season",
  "Structured league volleyball Oct–April — hall, coach, and fixtures",
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
