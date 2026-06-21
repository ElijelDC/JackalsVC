import { jsonError, requireAdmin } from "@/lib/api";
import { completeMatchedPayment } from "@/lib/payment-match";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ paymentId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { session, response: authError } = await requireAdmin();
  if (authError) return authError;

  const { paymentId } = await context.params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!payment) return jsonError("Payment not found", 404);
    if (payment.status === "COMPLETED") {
      return jsonError("Payment is already marked as paid", 400);
    }

    await completeMatchedPayment(payment.id, {
      externalId: `admin:${session!.user.id}:${Date.now()}`,
      externalCode: "Approved by admin",
    });

    const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
    return NextResponse.json({ payment: updated });
  } catch (error) {
    console.error("Admin payment approval failed:", error);
    return jsonError("Failed to approve payment", 500);
  }
}
