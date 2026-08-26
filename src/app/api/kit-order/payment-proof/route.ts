import { jsonError, jsonServerError } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import {
  deleteKitOrderProofFile,
  saveKitOrderProofFile,
  validateKitOrderProofFile,
} from "@/lib/kit-order-payment-proof";
import { buildKitOrderPaymentQuote } from "@/lib/kit-order-payment-summary";
import { serializeKitOrder, kitOrderFullName } from "@/lib/kit-order-response-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const EUR = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const paymentToken = formData.get("paymentToken");
    const screenshot = formData.get("screenshot");

    if (typeof paymentToken !== "string" || !paymentToken.trim()) {
      return jsonError("Invalid payment link", 400);
    }

    if (!(screenshot instanceof File)) {
      return jsonError("Screenshot file required", 400);
    }

    const fileError = validateKitOrderProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const order = await prisma.kitOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });

    if (!order) return jsonError("Kit order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This kit order is already marked as paid", 400);
    }

    if (order.proofScreenshotUrl) {
      await deleteKitOrderProofFile(order.proofScreenshotUrl);
    }

    const proofScreenshotUrl = await saveKitOrderProofFile(order.id, screenshot);

    const updated = await prisma.kitOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl,
        proofSubmittedAt: new Date(),
        paymentStatus: "PROOF_SUBMITTED",
      },
    });

    const fullName = kitOrderFullName(order);
    const total = buildKitOrderPaymentQuote(serializeKitOrder(order)).totalEur;

    if (isEmailConfigured()) {
      await notifyAdmins({
        subject: `Kit payment receipt — ${fullName}`,
        replyTo: order.email,
        content: {
          heading: "Kit order payment receipt",
          paragraphs: [
            `${fullName} uploaded a bank transfer screenshot for their 2026/27 kit order.`,
          ],
          details: [
            { label: "Name", value: fullName },
            { label: "Email", value: order.email },
            { label: "Amount", value: EUR.format(total) },
          ],
          imageUrl: emailSiteUrl(proofScreenshotUrl),
          imageAlt: "Kit order payment receipt",
          ctaUrl: emailSiteUrl("/admin/kit-orders"),
          ctaLabel: "View kit orders",
        },
      });
    }

    return NextResponse.json({
      order: updated,
      message:
        "Receipt received. We'll verify your payment and confirm by email.",
    });
  } catch (error) {
    return jsonServerError("Failed to upload payment receipt", {
      route: "POST /api/kit-order/payment-proof",
      cause: error,
    });
  }
}

export async function DELETE(request: Request) {
  const paymentToken = new URL(request.url).searchParams.get("paymentToken");
  if (!paymentToken?.trim()) {
    return jsonError("Invalid payment link", 400);
  }

  try {
    const order = await prisma.kitOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });

    if (!order) return jsonError("Kit order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This kit order is already marked as paid", 400);
    }
    if (!order.proofScreenshotUrl || !order.proofSubmittedAt) {
      return jsonError("No screenshot to remove", 400);
    }

    await deleteKitOrderProofFile(order.proofScreenshotUrl);

    const updated = await prisma.kitOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl: null,
        proofSubmittedAt: null,
        paymentStatus: "AWAITING",
      },
    });

    return NextResponse.json({
      order: updated,
      message: "Screenshot removed. You can upload a new one when ready.",
    });
  } catch (error) {
    return jsonServerError("Failed to remove payment receipt", {
      route: "DELETE /api/kit-order/payment-proof",
      cause: error,
    });
  }
}
