import { NextResponse } from "next/server";
import { parseJsonBody, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import type { z } from "zod";

function toProductData(data: z.infer<typeof productSchema>) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    imageUrl: data.imageUrl || null,
    category: data.category,
    sizes: data.sizes || null,
    stock: data.stock,
    active: data.active,
  };
}

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { data, response: parseError } = await parseJsonBody(request, productSchema);
  if (parseError || !data) return parseError!;

  const product = await prisma.product.create({ data: toProductData(data) });
  return NextResponse.json({ product }, { status: 201 });
}
