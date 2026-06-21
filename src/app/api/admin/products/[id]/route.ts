import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const { data, response: parseError } = await parseJsonBody(request, productSchema);
  if (parseError || !data) return parseError!;

  try {
    const product = await prisma.product.update({
      where: { id },
      data: toProductData(data),
    });
    return NextResponse.json({ product });
  } catch {
    return jsonError("Product not found", 404);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return jsonError("Product not found", 404);
  }
}
