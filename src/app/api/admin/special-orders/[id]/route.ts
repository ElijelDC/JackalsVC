import { NextResponse } from "next/server";
import { jsonError, jsonServerError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deleteSpecialOrderProofFile } from "@/lib/special-order-payment-proof";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  try {
    const order = await prisma.specialOrder.findUnique({ where: { id } });
    if (!order) return jsonError("Special order not found", 404);
    if (order.proofScreenshotUrl) {
      await deleteSpecialOrderProofFile(order.proofScreenshotUrl);
    }
    await prisma.specialOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonServerError("Failed to delete special order", {
      route: "DELETE /api/admin/special-orders/[id]",
      cause: error,
    });
  }
}
