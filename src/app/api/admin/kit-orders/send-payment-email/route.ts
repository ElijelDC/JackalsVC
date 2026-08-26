import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { sendKitOrderPaymentEmail } from "@/lib/send-kit-order-payment-email";
import { prisma } from "@/lib/prisma";

const sendPaymentEmailSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  if (!isEmailConfigured()) {
    return jsonError(
      "Email is not configured on the server. Add SMTP settings before sending payment emails.",
      503,
    );
  }

  const { data, response: parseError } = await parseJsonBody(
    request,
    sendPaymentEmailSchema,
  );
  if (parseError || !data) return parseError!;

  const rows = await prisma.kitOrder.findMany({
    where: { id: { in: data.orderIds } },
  });

  if (rows.length === 0) {
    return jsonError("No matching kit orders found.", 404);
  }

  const byId = new Map(rows.map((row) => [row.id, serializeKitOrder(row)]));
  const ordered = data.orderIds
    .map((id) => byId.get(id))
    .filter((order): order is NonNullable<typeof order> => Boolean(order));

  if (ordered.length === 0) {
    return jsonError("No matching kit orders found.", 404);
  }

  let delivered = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const order of ordered) {
    const result = await sendKitOrderPaymentEmail(order);
    if (result.delivered) {
      delivered += 1;
      await prisma.kitOrder.update({
        where: { id: order.id },
        data: { paymentEmailSentAt: new Date() },
      });
    } else {
      failed += 1;
      failures.push(order.email);
    }
  }

  if (delivered === 0) {
    return jsonError(
      "Payment emails could not be sent. Check SMTP settings and try again.",
      503,
    );
  }

  return NextResponse.json({
    attempted: ordered.length,
    delivered,
    failed,
    failures,
  });
}
