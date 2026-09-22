import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;
  const orders = await prisma.specialOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders: orders.map(serializeSpecialOrder) });
}
