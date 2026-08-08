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
    const existing = await prisma.clubOfferAcceptance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return jsonError(
        "This response was not found. Refresh the page — it may have already been deleted.",
        404,
      );
    }

    await prisma.clubOfferAcceptance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[club-offer-acceptances] DELETE failed", error);
    return jsonError(
      "We couldn't delete this response. Refresh the page and try again.",
      500,
    );
  }
}
