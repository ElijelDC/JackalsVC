export const MEMBERSHIP_SEASON_LABEL = "October 2026 – May 2027";

export const KIT_FEE_EUR = 50;

/** Approximate training nights per squad across the Oct–May season. */
export const MEMBERSHIP_TRAINING_NIGHTS_PER_SEASON = 28;

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
    adultFee: 360,
    studentFee: 315,
  },
  {
    id: "regional-league",
    league: "Regional League",
    name: "Regional League team",
    squads: "Regional Men",
    homeMatches: 4,
    adultFee: 320,
    studentFee: 275,
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
