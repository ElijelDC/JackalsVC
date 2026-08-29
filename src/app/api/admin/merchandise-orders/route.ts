import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const orders = await prisma.merchandiseOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders: orders.map(serializeMerchandiseOrder) });
}
