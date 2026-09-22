import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { notifySpecialOrderPaymentApproved } from "@/lib/send-special-order-payment-approved-email";

export async function completeSpecialOrderPayment(
  orderId: string,
  options?: { sendEmail?: boolean },
): Promise<{ emailDelivered: boolean }> {
  const order = await prisma.specialOrder.findUnique({
    where: { id: orderId },
  });
  if (!order || order.paymentStatus === "PAID") {
    return { emailDelivered: false };
  }

  await prisma.specialOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  if (!(options?.sendEmail ?? true) || !isEmailConfigured()) {
    return { emailDelivered: false };
  }
  const result = await notifySpecialOrderPaymentApproved(orderId);
  return { emailDelivered: result.delivered };
}
