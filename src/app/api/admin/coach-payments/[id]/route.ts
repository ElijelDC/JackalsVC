import { NextResponse } from "next/server";
import { jsonError, parseJsonBody, requireAdmin } from "@/lib/api";
import {
  calculateCoachSalaryAmount,
  COACH_SESSION_RATE_EUR,
} from "@/lib/coach-payments-config";
import { prisma } from "@/lib/prisma";
import { coachSalaryPaymentUpdateSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.coachSalaryPayment.findUnique({ where: { id } });
  if (!existing) return jsonError("Payment record not found", 404);

  const { data, response: parseError } = await parseJsonBody(
    request,
    coachSalaryPaymentUpdateSchema,
  );
  if (parseError || !data) return parseError!;

  const ratePerSession = existing.ratePerSession || COACH_SESSION_RATE_EUR;
  const amount = calculateCoachSalaryAmount(data.sessionCount, ratePerSession);
  const nextStatus = data.status ?? existing.status;
  const paidAt =
    nextStatus === "PAID"
      ? existing.paidAt ?? new Date()
      : null;

  const payment = await prisma.coachSalaryPayment.update({
    where: { id },
    data: {
      sessionCount: data.sessionCount,
      amount,
      status: nextStatus,
      paidAt,
      notes: data.notes ?? existing.notes,
    },
  });

  return NextResponse.json({
    payment: {
      id: payment.id,
      year: payment.year,
      month: payment.month,
      sessionCount: payment.sessionCount,
      ratePerSession: payment.ratePerSession,
      amount: payment.amount,
      status: payment.status,
      invoiceScreenshotUrl: payment.invoiceScreenshotUrl,
      paidAt: payment.paidAt?.toISOString() ?? null,
      notes: payment.notes,
    },
  });
}
