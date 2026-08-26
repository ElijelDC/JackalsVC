import {
  buildKitOrderPaymentEmailDetails,
  buildKitOrderPaymentQuote,
} from "@/lib/kit-order-payment-summary";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import { sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  serializeKitOrder,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";

export async function sendKitOrderPaymentApprovedEmail(order: KitOrderRecord) {
  const quote = buildKitOrderPaymentQuote(order);
  const firstName = order.firstName.trim() || "there";
  const orderDetails = buildKitOrderPaymentEmailDetails(order).filter(
    (row) => row.label !== "Total due",
  );

  return sendNotificationEmail({
    to: order.email,
    subject: "Kit payment confirmed — Jackals VC",
    content: {
      heading: "Payment confirmed",
      greeting: `Hi ${firstName},`,
      paragraphs: [
        `We've verified your bank transfer for your 2026/27 kit order. Your payment is confirmed — thank you!`,
        `We'll be in touch about kit collection and delivery as the season approaches.`,
      ],
      details: [
        { label: "Amount paid", value: formatMembershipEuro(quote.totalEur) },
        ...orderDetails,
      ],
      footnote: "Questions about your order? Reply to this email.",
    },
  });
}

/** Emails the player after an admin approves their kit payment receipt. Never throws. */
export async function notifyKitOrderPaymentApproved(
  orderId: string,
): Promise<{ delivered: boolean }> {
  try {
    const row = await prisma.kitOrder.findUnique({ where: { id: orderId } });
    if (!row) return { delivered: false };

    return await sendKitOrderPaymentApprovedEmail(serializeKitOrder(row));
  } catch (error) {
    console.error("[notify] failed to send kit payment approved email", error);
    return { delivered: false };
  }
}
