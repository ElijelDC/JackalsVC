import { jsonError, requireSession } from "@/lib/api";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import {
  deletePaymentProofFile,
  savePaymentProofFile,
  validateProofFile,
} from "@/lib/payment-proof";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const EUR = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export async function POST(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const paymentId = formData.get("paymentId");
    const screenshot = formData.get("screenshot");

    if (typeof paymentId !== "string" || !paymentId) {
      return jsonError("Payment ID required", 400);
    }

    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file required", 400);
    }

    const fileError = validateProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session!.user.id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!payment) return jsonError("Payment not found", 404);
    if (payment.status === "COMPLETED") {
      return jsonError("This payment is already marked as paid", 400);
    }

    const proofScreenshotUrl = await savePaymentProofFile(payment.id, screenshot);

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        proofScreenshotUrl,
        proofSubmittedAt: new Date(),
      },
    });

    const memberName = payment.user?.name ?? "A member";
    await notifyAdmins({
      subject: `Payment proof submitted — ${memberName}`,
      replyTo: payment.user?.email ?? undefined,
      content: {
        heading: "New payment proof to verify",
        paragraphs: [
          `${memberName} uploaded a payment screenshot. Check it against the bank statement, then mark the payment as paid.`,
        ],
        details: [
          { label: "Member", value: memberName },
          { label: "Amount", value: EUR.format(payment.amount) },
          { label: "Description", value: payment.description },
          { label: "Reference", value: payment.paymentReference },
        ],
        imageUrl: emailSiteUrl(proofScreenshotUrl),
        imageAlt: "Submitted payment screenshot",
        ctaUrl: emailSiteUrl("/admin/payments"),
        ctaLabel: "Review payments",
      },
    });

    return NextResponse.json({
      payment: updatedPayment,
      message:
        "Screenshot received. A club admin will verify your payment against the bank statement.",
    });
  } catch (error) {
    console.error("Payment proof upload failed:", error);
    return jsonError("Failed to upload payment screenshot", 500);
  }
}

export async function DELETE(request: Request) {
  const { session, response: authError } = await requireSession();
  if (authError) return authError;

  const paymentId = new URL(request.url).searchParams.get("paymentId");
  if (!paymentId) return jsonError("Payment ID required", 400);

  try {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: session!.user.id },
    });

    if (!payment) return jsonError("Payment not found", 404);
    if (payment.status === "COMPLETED") {
      return jsonError("This payment is already marked as paid", 400);
    }
    if (!payment.proofScreenshotUrl || !payment.proofSubmittedAt) {
      return jsonError("No screenshot to remove", 400);
    }

    await deletePaymentProofFile(payment.proofScreenshotUrl);

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        proofScreenshotUrl: null,
        proofSubmittedAt: null,
      },
    });

    return NextResponse.json({
      payment: updatedPayment,
      message: "Screenshot removed. You can upload a new one when ready.",
    });
  } catch (error) {
    console.error("Payment proof removal failed:", error);
    return jsonError("Failed to remove payment screenshot", 500);
  }
}
