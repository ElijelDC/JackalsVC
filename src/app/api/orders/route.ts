import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { orderSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const { data, response: parseError } = await parseJsonBody(
    request,
    orderSchema,
    "Invalid order",
  );
  if (parseError || !data) return parseError!;

  try {
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== productIds.length) {
      return jsonError("One or more products are unavailable", 400);
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let total = 0;

    for (const item of data.items) {
      const product = productMap.get(item.productId)!;
      if (product.stock < item.quantity) {
        return jsonError(`${product.name} is out of stock`, 400);
      }
      total += product.price * item.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session!.user.id,
          total,
          status: "PAID",
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
              size: item.size,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch {
    return jsonError("Failed to process order", 500);
  }
}
