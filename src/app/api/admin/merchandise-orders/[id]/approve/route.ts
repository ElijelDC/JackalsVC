import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { completeMerchandiseOrderPayment } from "@/lib/complete-merchandise-order-payment";
import { isEmailConfigured } from "@/lib/email";
import { canApproveMerchandiseOrderPayment } from "@/lib/merchandise-order-payment-access";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  try {
    const order = await prisma.merchandiseOrder.findUnique({ where: { id } });
    if (!order) return jsonError("Merchandise order not found", 404);
    if (!canApproveMerchandiseOrderPayment(order)) {
      return jsonError("Upload a payment receipt before approving", 400);
    }
    const { emailDelivered } = await completeMerchandiseOrderPayment(id);
    const updated = await prisma.merchandiseOrder.findUniqueOrThrow({
      where: { id },
    });
    return NextResponse.json({
      order: serializeMerchandiseOrder(updated),
      emailDelivered,
      message: emailDelivered
        ? "Payment approved and confirmation email sent."
        : isEmailConfigured()
          ? "Payment approved, but the confirmation email could not be sent."
          : "Payment approved. Email is not configured on this server.",
    });
  } catch (error) {
    console.error("[merchandise-orders] approve failed", error);
    return jsonError("Failed to approve merchandise payment", 500);
  }
}
