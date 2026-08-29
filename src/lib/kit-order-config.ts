import {
  CLUB_JACKET_FEE_EUR,
  KIT_FEE_EUR,
  MEMBERSHIP_CLUB_JACKETS_2026_27,
  MEMBERSHIP_MATCH_KITS_2026_27,
  type MembershipMerchItem202627,
} from "@/lib/membership-2026-27";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export const KIT_ORDER_GENDERS = ["men", "women"] as const;
export type KitOrderGender = (typeof KIT_ORDER_GENDERS)[number];

export const KIT_ORDER_KIT_TYPES = ["player", "libero", "both"] as const;
export type KitOrderKitType = (typeof KIT_ORDER_KIT_TYPES)[number];

export const KIT_ORDER_MEN_SIZES = [
  "3XS",
  "2XS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
] as const;

export const KIT_ORDER_WOMEN_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
] as const;

export type KitOrderSize =
  | (typeof KIT_ORDER_MEN_SIZES)[number]
  | (typeof KIT_ORDER_WOMEN_SIZES)[number];

export const KIT_ORDER_FEE_EUR = KIT_FEE_EUR;
export const KIT_ORDER_LAYER_FEE_EUR = CLUB_JACKET_FEE_EUR;
export const KIT_ORDER_TRAINING_TSHIRT_FEE_EUR = 15;

export const KIT_ORDER_GENDER_LABELS: Record<KitOrderGender, string> = {
  men: "Men's",
  women: "Women's",
};

export const KIT_ORDER_KIT_TYPE_LABELS: Record<KitOrderKitType, string> = {
  player: "Player kit",
  libero: "Libero kit",
  both: "Both kits",
};

export const KIT_ORDER_KIT_TYPE_HINTS: Record<KitOrderKitType, string> = {
  player: "Home match kit",
  libero: "Libero match kit",
  both: "Player kit and libero kit",
};

export const KIT_ORDER_PIECE_MODES = ["full", "jersey", "shorts"] as const;
export type KitOrderPieceMode = (typeof KIT_ORDER_PIECE_MODES)[number];

export const KIT_ORDER_PIECE_MODE_LABELS: Record<KitOrderPieceMode, string> = {
  full: "Full kit",
  jersey: "Jersey only",
  shorts: "Shorts only",
};

type SizeChartRow = {
  key: string;
  label: string;
  values: number[];
};

type SizeChart = {
  sizes: readonly string[];
  rows: SizeChartRow[];
};

export const KIT_ORDER_SIZE_CHARTS: Record<KitOrderGender, SizeChart> = {
  men: {
    sizes: KIT_ORDER_MEN_SIZES,
    rows: [
      { key: "A", label: "Chest (A)", values: [35.5, 38.5, 40.5, 44.5, 48, 50, 52, 54] },
      { key: "B", label: "Back length (B)", values: [54, 58, 62, 67, 71, 74, 77, 80] },
      { key: "C", label: "Waist (C)", values: [24, 26, 28, 30, 31, 33, 35, 37] },
      { key: "D", label: "Shorts length (D)", values: [32, 35, 38, 41, 44, 47, 49, 51] },
    ],
  },
  women: {
    sizes: KIT_ORDER_WOMEN_SIZES,
    rows: [
      { key: "A", label: "Chest (A)", values: [39, 41, 45, 49, 51, 54] },
      { key: "B", label: "Back length (B)", values: [59, 63, 67, 71, 74, 78] },
      { key: "C", label: "Waist (C)", values: [28, 30, 31, 33, 35, 37] },
      { key: "D", label: "Shorts length (D)", values: [38, 41, 44, 47, 49, 51] },
    ],
  },
};

export const KIT_ORDER_TSHIRT_SIZE_CHART: SizeChart = {
  sizes: ["3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL"],
  rows: [
    { key: "A", label: "Chest width (A)", values: [38, 41, 44, 47, 50, 52, 55, 57] },
    { key: "B", label: "Length (B)", values: [52, 60, 64, 68, 72, 76, 80, 83] },
    { key: "C", label: "Sleeve (C)", values: [24, 26, 30, 34, 37, 41, 44, 46] },
  ],
};

export const KIT_ORDER_JACKET_SIZE_CHART: SizeChart = {
  sizes: ["3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
  rows: [
    { key: "A", label: "Chest width (A)", values: [39, 43, 47, 51, 54, 57, 59, 61, 63, 65] },
    { key: "B", label: "Length (B)", values: [52, 56, 60, 64, 68, 71, 74, 77, 80, 83] },
  ],
};

export function kitOrderSizesForGender(gender: KitOrderGender): readonly string[] {
  return gender === "women" ? KIT_ORDER_WOMEN_SIZES : KIT_ORDER_MEN_SIZES;
}

export function isValidKitOrderSize(gender: KitOrderGender, size: string) {
  return (kitOrderSizesForGender(gender) as readonly string[]).includes(size);
}

export function kitOrderGenderLabel(gender: string) {
  if (gender === "men" || gender === "women") {
    return KIT_ORDER_GENDER_LABELS[gender];
  }
  return gender;
}

export function kitOrderKitTypeLabel(kitType: string) {
  if (kitType === "player" || kitType === "libero" || kitType === "both") {
    return KIT_ORDER_KIT_TYPE_LABELS[kitType];
  }
  return kitType;
}

export function kitOrderSizeGuideSrc(gender: KitOrderGender) {
  return gender === "women"
    ? PUBLIC_PATHS.downloads.kitOrderWomensSizeGuide
    : PUBLIC_PATHS.downloads.kitOrderMensSizeGuide;
}

export function kitOrderTshirtSizeGuideSrc() {
  return PUBLIC_PATHS.downloads.kitOrderTshirtSizeGuide;
}

export function kitOrderJacketSizeGuideSrc() {
  return PUBLIC_PATHS.downloads.kitOrderJacketSizeGuide;
}

export function kitOrderPhotosForGender(
  gender: KitOrderGender,
): MembershipMerchItem202627[] {
  const category: "men" | "women" = gender === "women" ? "women" : "men";
  return MEMBERSHIP_MATCH_KITS_2026_27.filter((item) => item.category === category);
}

export function kitOrderPhotosFor(
  gender: KitOrderGender,
  kitType: KitOrderKitType,
): MembershipMerchItem202627[] {
  const kits = kitOrderPhotosForGender(gender);

  if (kitType === "player") {
    return kits.filter((item) => item.id.endsWith("-home"));
  }
  if (kitType === "libero") {
    return kits.filter((item) => item.id.endsWith("-libero"));
  }
  return kits;
}

export function isPlayerKitPhoto(item: MembershipMerchItem202627) {
  return item.id.endsWith("-home");
}

export type KitOrderPieces = {
  playerJersey: boolean;
  playerShorts: boolean;
  liberoJersey: boolean;
  liberoShorts: boolean;
};

export function hasAnyKitPiece(pieces: KitOrderPieces) {
  return (
    pieces.playerJersey ||
    pieces.playerShorts ||
    pieces.liberoJersey ||
    pieces.liberoShorts
  );
}

export function hasAnyJersey(pieces: KitOrderPieces) {
  return pieces.playerJersey || pieces.liberoJersey;
}

export function hasAnyShorts(pieces: KitOrderPieces) {
  return pieces.playerShorts || pieces.liberoShorts;
}

export function summarizeKitType(pieces: KitOrderPieces): KitOrderKitType {
  const player = pieces.playerJersey || pieces.playerShorts;
  const libero = pieces.liberoJersey || pieces.liberoShorts;
  if (player && libero) return "both";
  if (libero) return "libero";
  return "player";
}

export function summarizeKitSize(jerseySize: string, shortsSize: string) {
  const jersey = jerseySize.trim();
  const shorts = shortsSize.trim();
  if (jersey && shorts) {
    return jersey === shorts ? jersey : `Jersey ${jersey} / shorts ${shorts}`;
  }
  return jersey || shorts;
}

export function kitOrderPiecesLabel(pieces: KitOrderPieces) {
  const parts: string[] = [];
  if (pieces.playerJersey) parts.push("Player jersey");
  if (pieces.playerShorts) parts.push("Player shorts");
  if (pieces.liberoJersey) parts.push("Libero jersey");
  if (pieces.liberoShorts) parts.push("Libero shorts");
  return parts.join(", ");
}

export function piecesFromKitSelection(
  kitType: KitOrderKitType,
  pieceMode: KitOrderPieceMode,
): KitOrderPieces {
  const wantsJersey = pieceMode !== "shorts";
  const wantsShorts = pieceMode !== "jersey";
  const wantsPlayer = kitType !== "libero";
  const wantsLibero = kitType !== "player";

  return {
    playerJersey: wantsPlayer && wantsJersey,
    playerShorts: wantsPlayer && wantsShorts,
    liberoJersey: wantsLibero && wantsJersey,
    liberoShorts: wantsLibero && wantsShorts,
  };
}

export function kitOrderKitCount(kitType: KitOrderKitType) {
  return kitType === "both" ? 2 : 1;
}

export type KitOrderLineItem = {
  id: string;
  label: string;
  details: string[];
  amountEur: number;
};

/** Stable quote line ids — used for admin free/waive overrides. */
export const KIT_ORDER_QUOTE_LINE_IDS = [
  "match-kit",
  "training-tshirt",
  "quarter-zip",
  "zip-hoodie",
  "high-collar",
  "full-zip",
] as const;

export type KitOrderQuoteLineId = (typeof KIT_ORDER_QUOTE_LINE_IDS)[number];

export function parseKitOrderFreeLineItemIds(
  value: string | null | undefined,
): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      .map((id) => id.trim());
  } catch {
    return [];
  }
}

export function serializeKitOrderFreeLineItemIds(ids: string[]): string {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  return JSON.stringify(unique);
}

export function applyKitOrderFreeLineItems(
  items: KitOrderLineItem[],
  freeLineItemIds: string[] | null | undefined,
): KitOrderLineItem[] {
  const free = new Set(freeLineItemIds ?? []);
  if (free.size === 0) return items;

  return items.map((item) => {
    if (!free.has(item.id) || item.amountEur <= 0) return item;
    return {
      ...item,
      amountEur: 0,
      details: item.details.includes("Free")
        ? item.details
        : [...item.details, "Free"],
    };
  });
}

export function kitOrderQuote(input: {
  kitType: KitOrderKitType;
  jerseySize: string;
  shortsSize: string;
  trainingTshirt: boolean;
  trainingTshirtSize: string;
  trainingTop: boolean;
  trainingTopSize: string;
  jacketHoodie: boolean;
  jacketHoodieSize: string;
  jacketHighCollar: boolean;
  jacketHighCollarSize: string;
  jacketFullZip: boolean;
  jacketFullZipSize: string;
  freeLineItemIds?: string[] | null;
}): { items: KitOrderLineItem[]; totalEur: number } {
  const kitCount = kitOrderKitCount(input.kitType);
  const kitDetails = [
    input.jerseySize ? `Jersey size ${input.jerseySize}` : "",
    input.shortsSize ? `Shorts size ${input.shortsSize}` : "",
  ].filter(Boolean);

  const items: KitOrderLineItem[] = [
    {
      id: "match-kit",
      label:
        kitCount === 2
          ? "Player kit + libero kit"
          : KIT_ORDER_KIT_TYPE_LABELS[input.kitType],
      details: kitDetails,
      amountEur: KIT_ORDER_FEE_EUR * kitCount,
    },
  ];

  if (input.trainingTshirt) {
    items.push({
      id: "training-tshirt",
      label: "Training t-shirt",
      details: input.trainingTshirtSize
        ? [`Size ${input.trainingTshirtSize}`]
        : [],
      amountEur: KIT_ORDER_TRAINING_TSHIRT_FEE_EUR,
    });
  }

  const jackets: Array<{
    included: boolean;
    id: string;
    label: string;
    size: string;
  }> = [
    {
      included: input.trainingTop,
      id: "quarter-zip",
      label: "Quarter zip",
      size: input.trainingTopSize,
    },
    {
      included: input.jacketHoodie,
      id: "zip-hoodie",
      label: "Zip hoodie",
      size: input.jacketHoodieSize,
    },
    {
      included: input.jacketHighCollar,
      id: "high-collar",
      label: "High collar zip",
      size: input.jacketHighCollarSize,
    },
    {
      included: input.jacketFullZip,
      id: "full-zip",
      label: "Full zip",
      size: input.jacketFullZipSize,
    },
  ];

  for (const jacket of jackets) {
    if (!jacket.included) continue;
    items.push({
      id: jacket.id,
      label: jacket.label,
      details: jacket.size ? [`Size ${jacket.size}`] : [],
      amountEur: KIT_ORDER_LAYER_FEE_EUR,
    });
  }

  const priced = applyKitOrderFreeLineItems(items, input.freeLineItemIds);

  return {
    items: priced,
    totalEur: priced.reduce((sum, item) => sum + item.amountEur, 0),
  };
}

function jacketById(id: string): MembershipMerchItem202627 {
  const item = MEMBERSHIP_CLUB_JACKETS_2026_27.find((jacket) => jacket.id === id);
  if (!item) {
    throw new Error(`Missing membership merch image: ${id}`);
  }
  return item;
}

export const KIT_ORDER_TRAINING_TSHIRT: MembershipMerchItem202627 = {
  id: "training-tshirt",
  title: "Training t-shirt",
  subtitle: "Short sleeve",
  imageSrc: PUBLIC_PATHS.downloads.kitOrderTrainingTshirt,
  imageAlt:
    "Jackals VC training t-shirt in black with a geometric pattern, club crest on the chest, and JACKALS on the back",
  accent: "red",
};

export const KIT_ORDER_QUARTER_ZIP: MembershipMerchItem202627 = {
  ...jacketById("jacket-quarter-zip"),
  title: "Quarter zip",
  subtitle: "Club jacket",
};

export const KIT_ORDER_TRAINING_TOPS: MembershipMerchItem202627[] = [
  KIT_ORDER_TRAINING_TSHIRT,
];

export const KIT_ORDER_JACKETS: MembershipMerchItem202627[] = [
  KIT_ORDER_QUARTER_ZIP,
  {
    ...jacketById("jacket-hoodie"),
    title: "Zip hoodie",
    subtitle: "Club jacket",
  },
  {
    ...jacketById("jacket-high-collar"),
    title: "High collar zip",
    subtitle: "Club jacket",
  },
  {
    ...jacketById("jacket-full-zip"),
    title: "Full zip",
    subtitle: "Club jacket",
  },
];

export function jerseyBackName(lastName: string) {
  return lastName.trim().toUpperCase();
}

export const KIT_ORDER_NUMBER_CLASH_COPY =
  "If two players want the same number, we will contact you regarding this.";
