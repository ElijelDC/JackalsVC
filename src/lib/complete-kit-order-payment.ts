import { isEmailConfigured } from "@/lib/email";
import { notifyKitOrderPaymentApproved } from "@/lib/send-kit-order-payment-approved-email";
import { prisma } from "@/lib/prisma";

export async function completeKitOrderPayment(
  orderId: string,
  options?: { sendEmail?: boolean },
): Promise<{ emailDelivered: boolean }> {
  const order = await prisma.kitOrder.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") {
    return { emailDelivered: false };
  }

  await prisma.kitOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  const sendEmail = options?.sendEmail ?? true;
  if (!sendEmail || !isEmailConfigured()) {
    return { emailDelivered: false };
  }

  const result = await notifyKitOrderPaymentApproved(orderId);
  return { emailDelivered: result.delivered };
}
