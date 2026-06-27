import { NextResponse } from "next/server";
import {
  deleteCoachInvoiceFile,
  saveCoachInvoiceFile,
  validateCoachInvoiceFile,
} from "@/lib/coach-invoice-proof";
import { jsonError, requireAdmin } from "@/lib/api";
import { notifyCoachPaymentPaid } from "@/lib/coach-payment-notify";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.coachSalaryPayment.findUnique({ where: { id } });
  if (!existing) return jsonError("Payment record not found", 404);

  try {
    const formData = await request.formData();
    const screenshot = formData.get("screenshot");

    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file is required", 400);
    }

    const fileError = validateCoachInvoiceFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    if (existing.invoiceScreenshotUrl) {
      await deleteCoachInvoiceFile(existing.invoiceScreenshotUrl);
    }

    const invoiceScreenshotUrl = await saveCoachInvoiceFile(id, screenshot);

    const payment = await prisma.coachSalaryPayment.update({
      where: { id },
      data: {
        invoiceScreenshotUrl,
        status: "PAID",
        paidAt: existing.paidAt ?? new Date(),
      },
    });

    if (existing.status !== "PAID") {
      await notifyCoachPaymentPaid(payment.id);
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        invoiceScreenshotUrl: payment.invoiceScreenshotUrl,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Coach invoice upload failed:", error);
    return jsonError("Failed to upload invoice screenshot", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.coachSalaryPayment.findUnique({ where: { id } });
  if (!existing) return jsonError("Payment record not found", 404);

  if (!existing.invoiceScreenshotUrl) {
    return jsonError("No screenshot to remove", 400);
  }

  await deleteCoachInvoiceFile(existing.invoiceScreenshotUrl);

  const payment = await prisma.coachSalaryPayment.update({
    where: { id },
    data: {
      invoiceScreenshotUrl: null,
      status: "PENDING",
      paidAt: null,
    },
  });

  return NextResponse.json({
    payment: {
      id: payment.id,
      invoiceScreenshotUrl: null,
      status: payment.status,
      paidAt: null,
    },
  });
}
