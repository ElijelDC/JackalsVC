import { kitOrderPaymentPath } from "@/lib/kit-order-payment-access";
import {
  buildKitOrderPaymentBankDetails,
  buildKitOrderPaymentEmailDetails,
  buildKitOrderPaymentQuote,
} from "@/lib/kit-order-payment-summary";
import { KIT_PAYMENT_DUE } from "@/lib/membership-2026-27";
import { emailSiteUrl, sendNotificationEmail } from "@/lib/notify";
import { getClubBankDetails } from "@/lib/payments";
import {
  kitOrderFullName,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";

export async function sendKitOrderPaymentEmail(order: KitOrderRecord) {
  const bank = getClubBankDetails();
  const quote = buildKitOrderPaymentQuote(order);
  const firstName = order.firstName.trim() || "there";
  const amountLabel = quote.totalEur.toLocaleString("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const paymentParagraphs =
    quote.totalEur <= 0
      ? [
          `Thanks for submitting your 2026/27 kit order with Jackals VC. Here is a summary of what you ordered.`,
          `No payment is due for your order — one or more items have been covered by the club. If anything looks wrong, reply to this email and we will help.`,
        ]
      : [
          `Thanks for submitting your 2026/27 kit order with Jackals VC. Here is a summary of what you ordered and how to pay.`,
          `Please transfer ${amountLabel} by bank transfer using the club IBAN below. Copy the payment reference exactly into your banking app so we can match your payment.`,
          `Kit payment is due ${KIT_PAYMENT_DUE}. If anything in your order looks wrong, reply to this email and we will help.`,
          "Bank transfer details:",
        ];

  return sendNotificationEmail({
    to: order.email,
    subject: "Your Jackals VC kit order — payment details",
    content: {
      heading: "Kit order summary & payment",
      greeting: `Hi ${firstName},`,
      paragraphs: paymentParagraphs,
      details: [
        ...buildKitOrderPaymentEmailDetails(order),
        ...(quote.totalEur > 0
          ? buildKitOrderPaymentBankDetails(order, bank)
          : []),
      ],
      ctaUrl: emailSiteUrl(kitOrderPaymentPath(order.paymentToken)),
      ctaLabel: quote.totalEur > 0 ? "View order & pay" : "View your order",
      footnote:
        "Questions about sizes or your order? Reply to this email and the club will be in touch.",
    },
  });
}

export function kitOrderPaymentEmailPreviewName(order: KitOrderRecord) {
  return kitOrderFullName(order);
}
