import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import {
  buildMerchandiseOrdersWorkbook,
  merchandiseOrdersExportFilename,
} from "@/lib/merchandise-orders-export";
import {
  merchandiseOrderItemSummary,
  serializeMerchandiseOrder,
} from "@/lib/merchandise-order-response-config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  const search =
    new URL(request.url).searchParams.get("search")?.trim().toLowerCase() ?? "";
  const rows = await prisma.merchandiseOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  const orders = rows.map(serializeMerchandiseOrder).filter((order) => {
    if (!search) return true;
    return [
      order.firstName,
      order.lastName,
      order.email,
      order.phoneNumber,
      order.genderLabel,
      ...merchandiseOrderItemSummary(order),
    ]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
  const buffer = await buildMerchandiseOrdersWorkbook(orders);
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${merchandiseOrdersExportFilename()}"`,
      "Cache-Control": "no-store",
    },
  });
}
