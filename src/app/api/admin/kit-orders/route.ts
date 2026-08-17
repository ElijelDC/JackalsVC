import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const orders = await prisma.kitOrder.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    orders: orders.map(serializeKitOrder),
  });
}
