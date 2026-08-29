import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { notifyMerchandiseOrderPaymentApproved } from "@/lib/send-merchandise-order-payment-approved-email";

export async function completeMerchandiseOrderPayment(
  orderId: string,
  options?: { sendEmail?: boolean },
): Promise<{ emailDelivered: boolean }> {
  const order = await prisma.merchandiseOrder.findUnique({
    where: { id: orderId },
  });
  if (!order || order.paymentStatus === "PAID") {
    return { emailDelivered: false };
  }

  await prisma.merchandiseOrder.update({
    where: { id: orderId },
    data: { paymentStatus: "PAID" },
  });

  if (!(options?.sendEmail ?? true) || !isEmailConfigured()) {
    return { emailDelivered: false };
  }
  const result = await notifyMerchandiseOrderPaymentApproved(orderId);
  return { emailDelivered: result.delivered };
}
