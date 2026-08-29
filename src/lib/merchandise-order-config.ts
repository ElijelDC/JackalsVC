import {
  KIT_ORDER_GENDERS,
  KIT_ORDER_GENDER_LABELS,
  KIT_ORDER_JACKETS,
  KIT_ORDER_LAYER_FEE_EUR,
  KIT_ORDER_MEN_SIZES,
  KIT_ORDER_TRAINING_TSHIRT,
  KIT_ORDER_TRAINING_TSHIRT_FEE_EUR,
  KIT_ORDER_WOMEN_SIZES,
  applyKitOrderFreeLineItems,
  isValidKitOrderSize,
  kitOrderGenderLabel,
  kitOrderJacketSizeGuideSrc,
  kitOrderSizesForGender,
  kitOrderTshirtSizeGuideSrc,
  parseKitOrderFreeLineItemIds,
  serializeKitOrderFreeLineItemIds,
  type KitOrderGender,
  type KitOrderLineItem,
  type KitOrderSize,
} from "@/lib/kit-order-config";

export {
  KIT_ORDER_GENDERS as MERCHANDISE_ORDER_GENDERS,
  KIT_ORDER_GENDER_LABELS as MERCHANDISE_ORDER_GENDER_LABELS,
  KIT_ORDER_JACKETS as MERCHANDISE_ORDER_JACKETS,
  KIT_ORDER_LAYER_FEE_EUR as MERCHANDISE_ORDER_LAYER_FEE_EUR,
  KIT_ORDER_MEN_SIZES as MERCHANDISE_ORDER_MEN_SIZES,
  KIT_ORDER_TRAINING_TSHIRT as MERCHANDISE_ORDER_TRAINING_TSHIRT,
  KIT_ORDER_TRAINING_TSHIRT_FEE_EUR as MERCHANDISE_ORDER_TRAINING_TSHIRT_FEE_EUR,
  KIT_ORDER_WOMEN_SIZES as MERCHANDISE_ORDER_WOMEN_SIZES,
  isValidKitOrderSize,
  kitOrderGenderLabel as merchandiseOrderGenderLabel,
  kitOrderJacketSizeGuideSrc,
  kitOrderSizesForGender as merchandiseOrderSizesForGender,
  kitOrderTshirtSizeGuideSrc,
  parseKitOrderFreeLineItemIds as parseMerchandiseOrderFreeLineItemIds,
  serializeKitOrderFreeLineItemIds as serializeMerchandiseOrderFreeLineItemIds,
};

export type MerchandiseOrderGender = KitOrderGender;
export type MerchandiseOrderSize = KitOrderSize;
export type MerchandiseOrderLineItem = KitOrderLineItem;

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

export function merchandiseOrderQuote(
  input: MerchandiseSelection & { freeLineItemIds?: string[] | null },
): { items: MerchandiseOrderLineItem[]; totalEur: number } {
  const items: MerchandiseOrderLineItem[] = [];

  if (input.trainingTshirt) {
    items.push({
      id: "training-tshirt",
      label: "Training t-shirt",
      details: input.trainingTshirtSize ? [`Size ${input.trainingTshirtSize}`] : [],
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
