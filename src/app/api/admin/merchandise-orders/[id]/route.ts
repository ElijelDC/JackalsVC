import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import { serializeMerchandiseOrderFreeLineItemIds } from "@/lib/merchandise-order-config";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { prisma } from "@/lib/prisma";
import { merchandiseOrderFreeLineItemsSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(
    request,
    merchandiseOrderFreeLineItemsSchema,
  );
  if (parseError || !data) return parseError!;
  const existing = await prisma.merchandiseOrder.findUnique({ where: { id } });
  if (!existing) return jsonError("This order was not found.", 404);
  const updated = await prisma.merchandiseOrder.update({
    where: { id },
    data: {
      freeLineItemIds: serializeMerchandiseOrderFreeLineItemIds(
        data.freeLineItemIds,
      ),
    },
  });
  return NextResponse.json({ order: serializeMerchandiseOrder(updated) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;
  const existing = await prisma.merchandiseOrder.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return jsonError("This order was not found.", 404);
  await prisma.merchandiseOrder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
