import { NextResponse } from "next/server";
import { jsonError, jsonServerError, requireAdmin } from "@/lib/api";
import { completeSpecialOrderPayment } from "@/lib/complete-special-order-payment";
import { prisma } from "@/lib/prisma";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  try {
    const order = await prisma.specialOrder.findUnique({ where: { id } });
    if (!order) return jsonError("Special order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This special order is already marked as paid", 400);
    }
    await completeSpecialOrderPayment(id);
    const updated = await prisma.specialOrder.findUniqueOrThrow({
      where: { id },
    });
    return NextResponse.json({ order: serializeSpecialOrder(updated) });
  } catch (error) {
    return jsonServerError("Failed to approve special order payment", {
      route: "POST /api/admin/special-orders/[id]/approve",
      cause: error,
    });
  }
}
