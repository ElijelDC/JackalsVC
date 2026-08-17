import { jsonError, requireAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
