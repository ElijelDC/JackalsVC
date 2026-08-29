import {
  buildMerchandiseOrderPaymentEmailDetails,
  buildMerchandiseOrderPaymentQuote,
} from "@/lib/merchandise-order-payment-summary";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import { sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  serializeMerchandiseOrder,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";

export async function sendMerchandiseOrderPaymentApprovedEmail(
  order: MerchandiseOrderRecord,
) {
  const quote = buildMerchandiseOrderPaymentQuote(order);
  const details = buildMerchandiseOrderPaymentEmailDetails(order).filter(
    (row) => row.label !== "Total due",
  );
  return sendNotificationEmail({
    to: order.email,
    subject: "Merch payment confirmed — Jackals VC",
    content: {
      heading: "Payment confirmed",
      greeting: `Hi ${order.firstName.trim() || "there"},`,
      paragraphs: [
        "We've verified your bank transfer for your 2026/27 merchandise order. Thank you!",
        "We'll be in touch about collection and delivery.",
      ],
      details: [
        { label: "Amount paid", value: formatMembershipEuro(quote.totalEur) },
        ...details,
      ],
      footnote: "Questions about your order? Reply to this email.",
    },
  });
}

export async function notifyMerchandiseOrderPaymentApproved(
  orderId: string,
): Promise<{ delivered: boolean }> {
  try {
    const row = await prisma.merchandiseOrder.findUnique({
      where: { id: orderId },
    });
    if (!row) return { delivered: false };
    return await sendMerchandiseOrderPaymentApprovedEmail(
      serializeMerchandiseOrder(row),
    );
  } catch (error) {
    console.error(
      "[notify] failed to send merchandise payment approved email",
      error,
    );
    return { delivered: false };
  }
}
