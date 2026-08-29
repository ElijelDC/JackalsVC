import {
  KIT_ORDER_JACKETS,
  KIT_ORDER_LAYER_FEE_EUR,
  KIT_ORDER_TRAINING_TSHIRT,
  KIT_ORDER_TRAINING_TSHIRT_FEE_EUR,
  applyKitOrderFreeLineItems,
  kitOrderJacketSizeGuideSrc,
  kitOrderTshirtSizeGuideSrc,
  parseKitOrderFreeLineItemIds,
  serializeKitOrderFreeLineItemIds,
  type KitOrderLineItem,
} from "@/lib/kit-order-config";

export {
  KIT_ORDER_JACKETS as MERCHANDISE_ORDER_JACKETS,
  KIT_ORDER_LAYER_FEE_EUR as MERCHANDISE_ORDER_LAYER_FEE_EUR,
  KIT_ORDER_TRAINING_TSHIRT as MERCHANDISE_ORDER_TRAINING_TSHIRT,
  KIT_ORDER_TRAINING_TSHIRT_FEE_EUR as MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR,
  kitOrderJacketSizeGuideSrc,
  kitOrderTshirtSizeGuideSrc,
  parseKitOrderFreeLineItemIds as parseMerchandiseOrderFreeLineItemIds,
  serializeKitOrderFreeLineItemIds as serializeMerchandiseOrderFreeLineItemIds,
};

/** Single unisex size chart for all merchandise (covers t-shirt + jackets). */
export const MERCHANDISE_ORDER_SIZES = [
  "3XS",
  "2XS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
] as const;

export type MerchandiseOrderSize = (typeof MERCHANDISE_ORDER_SIZES)[number];
export type MerchandiseOrderLineItem = KitOrderLineItem;

/** Stored on older rows; new orders always use unisex. */
export type MerchandiseOrderGender = "unisex" | "men" | "women";

export function isValidMerchandiseOrderSize(size: string) {
  return (MERCHANDISE_ORDER_SIZES as readonly string[]).includes(size);
}

export function merchandiseOrderGenderLabel(gender: string) {
  if (gender === "unisex" || !gender) return "Unisex";
  if (gender === "men") return "Men's (legacy)";
  if (gender === "women") return "Women's (legacy)";
  return gender;
}

export const MERCHANDISE_ORDER_QUOTE_LINE_IDS = [
  "training-tshirt",
  "quarter-zip",
  "zip-hoodie",
  "high-collar",
  "full-zip",
] as const;

export type MerchandiseOrderQuoteLineId =
  (typeof MERCHANDISE_ORDER_QUOTE_LINE_IDS)[number];

export type MerchandiseSelection = {
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
};

export function hasAnyMerchandiseItem(
  input: Pick<
    MerchandiseSelection,
    | "trainingTshirt"
    | "trainingTop"
    | "jacketHoodie"
    | "jacketHighCollar"
    | "jacketFullZip"
  >,
) {
  return (
    input.trainingTshirt ||
    input.trainingTop ||
    input.jacketHoodie ||
    input.jacketHighCollar ||
    input.jacketFullZip
  );
}

export type MerchandiseSizeIssue = {
  path: keyof MerchandiseSelection;
  label: string;
  message: string;
};

/** Client + server shared checks for selected items needing sizes. */
export function merchandiseOrderSizeIssues(
  input: MerchandiseSelection,
): MerchandiseSizeIssue[] {
  if (!hasAnyMerchandiseItem(input)) {
    return [
      {
        path: "trainingTshirt",
        label: "Items",
        message: "Choose at least one merchandise item to continue.",
      },
    ];
  }

  const checks: Array<{
    included: boolean;
    size: string;
    path: MerchandiseSizeIssue["path"];
    label: string;
  }> = [
    {
      included: input.trainingTshirt,
      size: input.trainingTshirtSize,
      path: "trainingTshirtSize",
      label: "training t-shirt",
    },
    {
      included: input.trainingTop,
      size: input.trainingTopSize,
      path: "trainingTopSize",
      label: "quarter zip",
    },
    {
      included: input.jacketHoodie,
      size: input.jacketHoodieSize,
      path: "jacketHoodieSize",
      label: "zip hoodie",
    },
    {
      included: input.jacketHighCollar,
      size: input.jacketHighCollarSize,
      path: "jacketHighCollarSize",
      label: "high collar zip",
    },
    {
      included: input.jacketFullZip,
      size: input.jacketFullZipSize,
      path: "jacketFullZipSize",
      label: "full zip",
    },
  ];

  const issues: MerchandiseSizeIssue[] = [];
  for (const check of checks) {
    if (!check.included) continue;
    if (!isValidMerchandiseOrderSize(check.size)) {
      issues.push({
        path: check.path,
        label: check.label,
        message: `Select a size for the ${check.label}.`,
      });
    }
  }
  return issues;
}

export function merchandiseOrderQuote(
  input: MerchandiseSelection & { freeLineItemIds?: string[] | null },
): { items: MerchandiseOrderLineItem[]; totalEur: number } {
  const items: MerchandiseOrderLineItem[] = [];

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

  const jackets = [
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
