import { merchandiseOrderPaymentPath } from "@/lib/merchandise-order-payment-access";
import {
  buildMerchandiseOrderPaymentBankDetails,
  buildMerchandiseOrderPaymentEmailDetails,
  buildMerchandiseOrderPaymentQuote,
} from "@/lib/merchandise-order-payment-summary";
import { KIT_PAYMENT_DUE } from "@/lib/membership-2026-27";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { getClubBankDetails } from "@/lib/payments";
import {
  merchandiseOrderFullName,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";

export async function sendMerchandiseOrderPaymentEmail(
  order: MerchandiseOrderRecord,
) {
  const bank = getClubBankDetails();
  const quote = buildMerchandiseOrderPaymentQuote(order);
  const firstName = order.firstName.trim() || "there";
  const amount = quote.totalEur.toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
  const paragraphs =
    quote.totalEur <= 0
      ? [
          "Thanks for submitting your 2026/27 merchandise order with Jackals VC.",
          "No payment is due — the selected items have been covered by the club.",
        ]
      : [
          "Thanks for submitting your 2026/27 merchandise order with Jackals VC.",
          `Please transfer ${amount} using the club IBAN below and copy the payment reference exactly.`,
          `Merch payment is due ${KIT_PAYMENT_DUE}. If anything looks wrong, reply to this email.`,
          "Bank transfer details:",
        ];

  return sendNotificationEmail({
    to: order.email,
    subject: "Your Jackals VC merchandise order — payment details",
    content: {
      heading: "Merchandise order summary & payment",
      greeting: `Hi ${firstName},`,
      paragraphs,
      details: [
        ...buildMerchandiseOrderPaymentEmailDetails(order),
        ...(quote.totalEur > 0
          ? buildMerchandiseOrderPaymentBankDetails(order, bank)
          : []),
      ],
      ctaUrl: emailSiteUrl(merchandiseOrderPaymentPath(order.paymentToken)),
      ctaLabel: quote.totalEur > 0 ? "View order & pay" : "View your order",
      footnote: "Questions about sizes or your order? Reply to this email.",
    },
  });
}

export function merchandiseOrderPaymentEmailPreviewName(
  order: MerchandiseOrderRecord,
) {
  return merchandiseOrderFullName(order);
}
