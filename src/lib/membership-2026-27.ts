export const MEMBERSHIP_SEASON_LABEL = "October 2026 – April 2027";

export const KIT_FEE_EUR = 45;

/** When kit payment is due (shown on the public membership page). */
export const KIT_PAYMENT_DUE = "first week of September";

export const MEMBERSHIP_FULL_COURT_TRAINING_COPY =
  "Full-court training sessions at Meakstown throughout the season for your squad";

export const MEMBERSHIP_COACHING_COPY =
  "Dedicated coaching staff for your squad every training night";

export const MEMBERSHIP_MERCHANDISE_COPY =
  "Reduced pricing on club merchandise";

/** Shown once below the league fee cards. */
export const MEMBERSHIP_LEAGUE_COVERAGE_COPY =
  "Full-court training sessions at Meakstown throughout the season for your squad, with dedicated coaching staff every training night. Members also get reduced pricing on club merchandise.";

export const MEMBERSHIP_FEES_BY_LEAGUE_INTRO =
  "Membership is priced by league tier. National League is for Division 2 Men and Division 3 Women; Regional League is for Regional Men. Amounts below are the full season total.";

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
  adultFee: number;
  studentFee: number;
};

export const MEMBERSHIP_LEAGUE_TIERS_2026_27: MembershipLeagueTier202627[] = [
  {
    id: "national-league",
    league: "National League",
    name: "National League team",
    squads: "Division 2 Men · Division 3 Women",
    adultFee: 365,
    studentFee: 320,
  },
  {
    id: "regional-league",
    league: "Regional League",
    name: "Regional League team",
    squads: "Regional Men",
    adultFee: 325,
    studentFee: 280,
  },
];

export const MEMBERSHIP_INCLUDES = [
  "Home matchday costs when the club hosts at Luttrellstown",
  "Structured league volleyball Oct–April — hall, coach, and fixtures",
  "Reduced member pricing on club fun sessions",
  MEMBERSHIP_MERCHANDISE_COPY,
] as const;

export const MEMBERSHIP_EXCLUDES = [
  `Club kit (€${KIT_FEE_EUR} — due ${KIT_PAYMENT_DUE}, separate from membership)`,
  "Volleyball Ireland League License",
  "Tournament entries",
  "Extra training beyond your team's weekly night",
] as const;

export function formatMembershipEuro(amount: number) {
  return `€${amount.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
}
