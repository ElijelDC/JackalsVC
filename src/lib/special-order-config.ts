import {
  KIT_ORDER_QUARTER_ZIP,
  KIT_ORDER_TRAINING_TSHIRT,
  kitOrderJacketSizeGuideSrc,
  kitOrderTshirtSizeGuideSrc,
} from "@/lib/kit-order-config";
import { MERCHANDISE_ORDER_SIZES } from "@/lib/merchandise-order-config";
import { parseDatetimeLocalAsClubTime } from "@/lib/datetime-form";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export const SPECIAL_ORDER_SIZES = MERCHANDISE_ORDER_SIZES;
export type SpecialOrderSize = (typeof SPECIAL_ORDER_SIZES)[number];

export const SPECIAL_ORDER_TSHIRT_FEE_EUR = 0;
export const SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR = 15;
export const SPECIAL_ORDER_TOTAL_EUR =
  SPECIAL_ORDER_TSHIRT_FEE_EUR + SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR;

/** Payment not due until 13 November 2026 (Europe/Dublin start of day). */
export const SPECIAL_ORDER_DUE_DATE = parseDatetimeLocalAsClubTime(
  "2026-11-13T00:00",
);

export const SPECIAL_ORDER_DUE_LABEL = "13 November 2026";

export const SPECIAL_ORDER_TSHIRT = {
  ...KIT_ORDER_TRAINING_TSHIRT,
  id: "warm-up-tshirt" as const,
  title: "Warm-up T-shirt",
  subtitle: "Included free",
  imageSrc: PUBLIC_PATHS.downloads.specialOrderWarmUpTshirt,
  imageAlt: "Jackals warm-up T-shirt — front and back",
};

export const SPECIAL_ORDER_QUARTER_ZIP = {
  ...KIT_ORDER_QUARTER_ZIP,
  id: "match-quarter-zip" as const,
  title: "Match quarter zip",
  subtitle: "€15",
  imageSrc: PUBLIC_PATHS.downloads.specialOrderMatchQuarterZip,
  imageAlt: "Jackals match quarter zip — front and back",
};

/** Shared frame so both product cards match on desktop. */
export const SPECIAL_ORDER_IMAGE_ASPECT_CLASS = "aspect-[1024/938]";

export {
  kitOrderJacketSizeGuideSrc as specialOrderJacketSizeGuideSrc,
  kitOrderTshirtSizeGuideSrc as specialOrderTshirtSizeGuideSrc,
};

export function isValidSpecialOrderSize(size: string) {
  return (SPECIAL_ORDER_SIZES as readonly string[]).includes(size);
}

export type SpecialOrderLineItem = {
  id: "warm-up-tshirt" | "match-quarter-zip";
  label: string;
  details: string[];
  amountEur: number;
};

export function specialOrderQuote(input: {
  tshirtSize: string;
  quarterZipSize: string;
}): { items: SpecialOrderLineItem[]; totalEur: number } {
  const items: SpecialOrderLineItem[] = [
    {
      id: "warm-up-tshirt",
      label: "Warm-up T-shirt",
      details: input.tshirtSize ? [`Size ${input.tshirtSize}`] : [],
      amountEur: SPECIAL_ORDER_TSHIRT_FEE_EUR,
    },
    {
      id: "match-quarter-zip",
      label: "Match quarter zip",
      details: input.quarterZipSize ? [`Size ${input.quarterZipSize}`] : [],
      amountEur: SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR,
    },
  ];
  return {
    items,
    totalEur: SPECIAL_ORDER_TOTAL_EUR,
  };
}

export function specialOrderFullName(order: {
  firstName: string;
  lastName: string;
}) {
  return `${order.firstName} ${order.lastName}`.trim();
}

export function specialOrderItemSummary(order: {
  tshirtSize: string;
  quarterZipSize: string;
}) {
  return [
    `Warm-up T-shirt (${order.tshirtSize})`,
    `Match quarter zip (${order.quarterZipSize})`,
  ];
}

export function buildSpecialOrderPaymentReference(order: {
  firstName: string;
  lastName: string;
}) {
  const name = specialOrderFullName(order)
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .toUpperCase()
    .slice(0, 24);
  return `SPECIAL ${name}`.trim();
}
