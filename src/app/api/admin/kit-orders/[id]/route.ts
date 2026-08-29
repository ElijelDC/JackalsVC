import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  serializeKitOrderFreeLineItemIds,
} from "@/lib/kit-order-config";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { prisma } from "@/lib/prisma";
import { kitOrderFreeLineItemsSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    kitOrderFreeLineItemsSchema,
  );
  if (parseError || !data) return parseError!;

  const existing = await prisma.kitOrder.findUnique({
    where: { id },
  });
  if (!existing) {
    return jsonError("This order was not found.", 404);
  }

  const updated = await prisma.kitOrder.update({
    where: { id },
    data: {
      freeLineItemIds: serializeKitOrderFreeLineItemIds(data.freeLineItemIds),
    },
  });

  return NextResponse.json({ order: serializeKitOrder(updated) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { id } = await params;
    const existing = await prisma.kitOrder.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return jsonError(
        "This order was not found. Refresh the page — it may have already been deleted.",
        404,
      );
    }

    await prisma.kitOrder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[kit-orders] DELETE failed", error);
    return jsonError(
      "We couldn't delete this order. Refresh the page and try again.",
      500,
    );
  }
}
