import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { prisma } from "@/lib/prisma";
import { sendMerchandiseOrderPaymentEmail } from "@/lib/send-merchandise-order-payment-email";

const schema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  if (!isEmailConfigured()) {
    return jsonError("Email is not configured on the server.", 503);
  }
  const { data, response: parseError } = await parseJsonBody(request, schema);
  if (parseError || !data) return parseError!;
  const rows = await prisma.merchandiseOrder.findMany({
    where: { id: { in: data.orderIds } },
  });
  const byId = new Map(rows.map((row) => [row.id, serializeMerchandiseOrder(row)]));
  const orders = data.orderIds
    .map((id) => byId.get(id))
    .filter((order): order is NonNullable<typeof order> => Boolean(order));
  if (!orders.length) return jsonError("No matching merchandise orders found.", 404);

  let delivered = 0;
  const failures: string[] = [];
  for (const order of orders) {
    const result = await sendMerchandiseOrderPaymentEmail(order);
    if (result.delivered) {
      delivered += 1;
      await prisma.merchandiseOrder.update({
        where: { id: order.id },
        data: { paymentEmailSentAt: new Date() },
      });
    } else {
      failures.push(order.email);
    }
  }
  if (!delivered) return jsonError("Payment emails could not be sent.", 503);
  return NextResponse.json({
    attempted: orders.length,
    delivered,
    failed: failures.length,
    failures,
  });
}
