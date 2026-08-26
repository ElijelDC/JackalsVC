import { jsonError, requireAdmin } from "@/lib/api";
import { completeKitOrderPayment } from "@/lib/complete-kit-order-payment";
import { canApproveKitOrderPayment } from "@/lib/kit-order-payment-access";
import { isEmailConfigured } from "@/lib/email";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    const order = await prisma.kitOrder.findUnique({ where: { id } });
    if (!order) {
      return jsonError("Kit order not found", 404);
    }
    if (order.paymentStatus === "PAID") {
      return jsonError("This kit order is already marked as paid", 400);
    }
    if (!canApproveKitOrderPayment(order)) {
      return jsonError("Upload a payment receipt before approving", 400);
    }

    const { emailDelivered } = await completeKitOrderPayment(id);
    const updated = await prisma.kitOrder.findUniqueOrThrow({ where: { id } });

    return NextResponse.json({
      order: serializeKitOrder(updated),
      emailDelivered,
      message: emailDelivered
        ? "Payment approved and confirmation email sent."
        : isEmailConfigured()
          ? "Payment approved, but the confirmation email could not be sent."
          : "Payment approved. Email is not configured on this server.",
    });
  } catch (error) {
    console.error("[kit-orders] approve failed", error);
    return jsonError("Failed to approve kit payment", 500);
  }
}
