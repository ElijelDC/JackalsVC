import { merchandiseOrderQuote } from "@/lib/merchandise-order-config";
import {
  merchandiseOrderFullName,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import type { NotificationDetail } from "@/lib/notify";

export const MERCHANDISE_ORDER_PAYMENT_REFERENCE_SUFFIX = "Merch 26/27";

export function buildMerchandiseOrderPaymentReference(
  order: Pick<MerchandiseOrderRecord, "firstName" | "lastName">,
) {
  return `${merchandiseOrderFullName(order)} · ${MERCHANDISE_ORDER_PAYMENT_REFERENCE_SUFFIX}`;
}

export function buildMerchandiseOrderPaymentQuote(order: MerchandiseOrderRecord) {
  return merchandiseOrderQuote({
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

export function buildMerchandiseOrderPaymentEmailDetails(
  order: MerchandiseOrderRecord,
): NotificationDetail[] {
  const quote = buildMerchandiseOrderPaymentQuote(order);
  return [
    ...quote.items.map((item) => ({
      label: item.label,
      value: `${item.amountEur <= 0 ? "Free" : formatMembershipEuro(item.amountEur)}${
        item.details.length ? ` (${item.details.join(", ")})` : ""
      }`,
    })),
    { label: "Total due", value: formatMembershipEuro(quote.totalEur) },
  ];
}

export function buildMerchandiseOrderPaymentBankDetails(
  order: MerchandiseOrderRecord,
  bank: { accountHolder: string; iban: string; accountLabel: string },
): NotificationDetail[] {
  return [
    { label: "Account name", value: bank.accountHolder },
    { label: "IBAN", value: bank.iban },
    { label: "Account", value: bank.accountLabel },
    {
      label: "Payment reference",
      value: buildMerchandiseOrderPaymentReference(order),
    },
    {
      label: "Amount to transfer",
      value: formatMembershipEuro(buildMerchandiseOrderPaymentQuote(order).totalEur),
    },
  ];
}
