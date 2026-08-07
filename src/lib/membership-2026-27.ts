export const MEMBERSHIP_SEASON_LABEL = "October 2026 – April 2027";

export const KIT_FEE_EUR = 45;

export const CLUB_JACKET_FEE_EUR = 25;

export const CLUB_JACKET_FULL_PRICE_EUR = 45;

export function formatMembershipEuro(amount: number) {
  return `€${amount.toLocaleString("en-IE", { maximumFractionDigits: 0 })}`;
}

/** When kit payment is due (shown on the public membership page). */
export const KIT_PAYMENT_DUE = "late August";

const MEMBERSHIP_MERCH_BASE = "/downloads/membership-2026-27/merch";

export type MembershipMerchCategory = "men" | "women";

export type MembershipMerchItem202627 = {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  accent?: "red" | "purple";
  category?: MembershipMerchCategory;
};

export const MEMBERSHIP_MATCH_KITS_2026_27: MembershipMerchItem202627[] = [
  {
    id: "mens-kit-home",
    title: "Men's club kit",
    subtitle: "Black & red — home",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/mens-kit-home.png`,
    imageAlt: "Men's Jackals home kit in black and red — jersey and shorts front and back",
    accent: "red",
    category: "men",
  },
  {
    id: "mens-kit-libero",
    title: "Men's club kit",
    subtitle: "Red & black — libero",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/mens-kit-libero.png`,
    imageAlt: "Men's Jackals libero kit in red and black — jersey and shorts front and back",
    accent: "red",
    category: "men",
  },
  {
    id: "womens-kit-home",
    title: "Women's kit",
    subtitle: "Black & purple — home",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/womens-kit-home.png`,
    imageAlt: "Women's Jackals home kit in black and purple — jersey and shorts front and back",
    accent: "purple",
    category: "women",
  },
  {
    id: "womens-kit-libero",
    title: "Women's kit",
    subtitle: "Purple & black — libero",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/womens-kit-libero.png`,
    imageAlt: "Women's Jackals libero kit in purple and black — jersey and shorts front and back",
    accent: "purple",
    category: "women",
  },
];

export const MEMBERSHIP_CLUB_JACKETS_2026_27: MembershipMerchItem202627[] = [
  {
    id: "jacket-quarter-zip",
    title: "Quarter zip",
    subtitle: "Club jacket",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/jacket-quarter-zip.png`,
    imageAlt: "Jackals club quarter-zip jacket in black with red accents — front and back",
    accent: "red",
  },
  {
    id: "jacket-hoodie",
    title: "Zip hoodie",
    subtitle: "Club jacket",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/jacket-hoodie.png`,
    imageAlt: "Jackals club zip hoodie in black with red accents — front and back",
    accent: "red",
  },
  {
    id: "jacket-high-collar",
    title: "High collar zip",
    subtitle: "Club jacket",
    imageSrc: `${MEMBERSHIP_MERCH_BASE}/jacket-high-collar.png`,
    imageAlt: "Jackals club high-collar zip jacket in black with red accents — front and back",
    accent: "red",
  },
];

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
    adultFee: 350,
    studentFee: 305,
  },
  {
    id: "regional-league",
    league: "Regional League",
    name: "Regional League team",
    squads: "Regional Men",
    adultFee: 310,
    studentFee: 265,
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
