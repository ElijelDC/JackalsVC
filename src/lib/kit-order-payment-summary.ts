import {
  jerseyBackName,
  kitOrderGenderLabel,
  kitOrderPiecesLabel,
  kitOrderQuote,
  type KitOrderKitType,
} from "@/lib/kit-order-config";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import {
  kitOrderFullName,
  kitOrderMerchSummary,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";
import type { NotificationDetail } from "@/lib/notify";

export const KIT_ORDER_PAYMENT_REFERENCE_SUFFIX = "Kit 26/27";

export function buildKitOrderPaymentReference(order: Pick<
  KitOrderRecord,
  "firstName" | "lastName"
>) {
  return `${kitOrderFullName(order)} · ${KIT_ORDER_PAYMENT_REFERENCE_SUFFIX}`;
}

function kitTypeForQuote(order: KitOrderRecord): KitOrderKitType {
  if (
    order.kitType === "player" ||
    order.kitType === "libero" ||
    order.kitType === "both"
  ) {
    return order.kitType;
  }
  return "player";
}

export function buildKitOrderPaymentQuote(order: KitOrderRecord) {
  return kitOrderQuote({
    kitType: kitTypeForQuote(order),
    jerseySize: order.jerseySize,
    shortsSize: order.shortsSize,
    trainingTshirt: order.trainingTshirt,
    trainingTshirtSize: order.trainingTshirtSize,
    trainingTop: order.trainingTop,
    trainingTopSize: order.trainingTopSize,
    jacketHoodie: order.jacketHoodie,
    jacketHoodieSize: order.jacketHoodieSize,
    jacketHighCollar: order.jacketHighCollar,
    jacketHighCollarSize: order.jacketHighCollarSize,
    jacketFullZip: order.jacketFullZip,
    jacketFullZipSize: order.jacketFullZipSize,
    freeLineItemIds: order.freeLineItemIds,
  });
}

export function buildKitOrderPaymentEmailDetails(
  order: KitOrderRecord,
): NotificationDetail[] {
  const quote = buildKitOrderPaymentQuote(order);
  const merch = kitOrderMerchSummary(order);
  const details: NotificationDetail[] = [];

  for (const item of quote.items) {
    const suffix =
      item.details.length > 0 ? ` (${item.details.join(", ")})` : "";
    details.push({
      label: item.label,
      value: `${item.amountEur <= 0 ? "Free" : formatMembershipEuro(item.amountEur)}${suffix}`,
    });
  }

  details.push({
    label: "Total due",
    value: formatMembershipEuro(quote.totalEur),
  });
  details.push({ label: "Jersey back", value: jerseyBackName(order.lastName) });
  details.push({ label: "Fit", value: kitOrderGenderLabel(order.gender) });
  details.push({
    label: "Kit",
    value: order.kitPiecesLabel || "—",
  });

  if (order.jerseySize || order.shortsSize) {
    details.push({
      label: "Sizes",
      value: [order.jerseySize && `Jersey ${order.jerseySize}`, order.shortsSize && `Shorts ${order.shortsSize}`]
        .filter(Boolean)
        .join(" · "),
    });
  }

  if (merch.length > 0) {
    details.push({ label: "Extras", value: merch.join(", ") });
  }

  return details;
}

export function buildKitOrderPaymentBankDetails(
  order: KitOrderRecord,
  bank: { accountHolder: string; iban: string; accountLabel: string },
): NotificationDetail[] {
  const reference = buildKitOrderPaymentReference(order);
  const total = buildKitOrderPaymentQuote(order).totalEur;

  return [
    { label: "Account name", value: bank.accountHolder },
    { label: "IBAN", value: bank.iban },
    { label: "Account", value: bank.accountLabel },
    { label: "Payment reference", value: reference },
    { label: "Amount to transfer", value: formatMembershipEuro(total) },
  ];
}
