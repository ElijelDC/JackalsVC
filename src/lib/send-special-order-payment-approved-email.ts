import { formatMembershipEuro } from "@/lib/membership-2026-27";
import { sendNotificationEmail } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import {
  SPECIAL_ORDER_TOTAL_EUR,
  specialOrderFullName,
  specialOrderItemSummary,
} from "@/lib/special-order-config";
import {
  serializeSpecialOrder,
  type SpecialOrderRecord,
} from "@/lib/special-order-response-config";

export async function sendSpecialOrderPaymentApprovedEmail(
  order: SpecialOrderRecord,
) {
  return sendNotificationEmail({
    to: order.email,
    subject: "Special order payment confirmed — Jackals VC",
    content: {
      heading: "Payment confirmed",
      greeting: `Hi ${order.firstName.trim() || "there"},`,
      paragraphs: [
        "We've verified your bank transfer for the warm-up T-shirt + match quarter zip package. Thank you!",
        "We'll be in touch about collection.",
      ],
      details: [
        {
          label: "Amount paid",
          value: formatMembershipEuro(SPECIAL_ORDER_TOTAL_EUR),
        },
        { label: "Name", value: specialOrderFullName(order) },
        { label: "Items", value: specialOrderItemSummary(order).join(", ") },
      ],
      footnote: "Questions about your order? Reply to this email.",
    },
  });
}

export async function notifySpecialOrderPaymentApproved(
  orderId: string,
): Promise<{ delivered: boolean }> {
  try {
    const row = await prisma.specialOrder.findUnique({
      where: { id: orderId },
    });
    if (!row) return { delivered: false };
    return await sendSpecialOrderPaymentApprovedEmail(
      serializeSpecialOrder(row),
    );
  } catch (error) {
    console.error(
      "[notify] failed to send special order payment approved email",
      error,
    );
    return { delivered: false };
  }
}
