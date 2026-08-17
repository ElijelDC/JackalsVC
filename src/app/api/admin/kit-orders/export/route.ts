import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import {
  KIT_ORDER_GENDERS,
  KIT_ORDER_KIT_TYPES,
} from "@/lib/kit-order-config";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import {
  buildKitOrdersWorkbook,
  kitOrdersExportFilename,
} from "@/lib/kit-orders-export";
import { prisma } from "@/lib/prisma";

function matchesSearch(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query);
}

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender");
  const kitType = searchParams.get("kitType");
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";

  const rows = await prisma.kitOrder.findMany({
    where: {
      ...(gender && (KIT_ORDER_GENDERS as readonly string[]).includes(gender)
        ? { gender }
        : {}),
      ...(kitType &&
      (KIT_ORDER_KIT_TYPES as readonly string[]).includes(kitType)
        ? { kitType }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = rows.map(serializeKitOrder);
  const filtered = search
    ? serialized.filter((row) =>
        matchesSearch(
          [
            row.firstName,
            row.lastName,
            row.email,
            row.phoneNumber,
            row.genderLabel,
            row.kitTypeLabel,
            row.kitPiecesLabel,
            row.jerseySize,
            row.shortsSize,
            row.preferredKitNumber1,
            row.preferredKitNumber2,
            row.trainingTshirtSize,
            row.trainingTopSize,
            row.jacketHoodieSize,
            row.jacketHighCollarSize,
            row.jacketFullZipSize,
          ].join(" "),
          search,
        ),
      )
    : serialized;

  const buffer = await buildKitOrdersWorkbook(filtered);
  const filename = kitOrdersExportFilename();

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
