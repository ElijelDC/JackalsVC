import { jsonError, jsonServerError } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import {
  deleteMerchandiseOrderProofFile,
  saveMerchandiseOrderProofFile,
  validateMerchandiseOrderProofFile,
} from "@/lib/merchandise-order-payment-proof";
import { buildMerchandiseOrderPaymentQuote } from "@/lib/merchandise-order-payment-summary";
import {
  merchandiseOrderFullName,
  serializeMerchandiseOrder,
} from "@/lib/merchandise-order-response-config";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
    const fileError = validateMerchandiseOrderProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const order = await prisma.merchandiseOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });
    if (!order) return jsonError("Merchandise order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This merchandise order is already paid", 400);
    }
    if (order.proofScreenshotUrl) {
      await deleteMerchandiseOrderProofFile(order.proofScreenshotUrl);
    }
    const proofScreenshotUrl = await saveMerchandiseOrderProofFile(
      order.id,
      screenshot,
    );
    const updated = await prisma.merchandiseOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl,
        proofSubmittedAt: new Date(),
        paymentStatus: "PROOF_SUBMITTED",
      },
    });

    if (isEmailConfigured()) {
      const record = serializeMerchandiseOrder(order);
      await notifyAdmins({
        subject: `Merch payment receipt — ${merchandiseOrderFullName(order)}`,
        replyTo: order.email,
        content: {
          heading: "Merchandise order payment receipt",
          paragraphs: [
            `${merchandiseOrderFullName(order)} uploaded a bank transfer screenshot.`,
          ],
          details: [
            { label: "Email", value: order.email },
            {
              label: "Amount",
              value: `€${buildMerchandiseOrderPaymentQuote(record).totalEur}`,
            },
          ],
          imageUrl: emailSiteUrl(proofScreenshotUrl),
          imageAlt: "Merchandise payment receipt",
          ctaUrl: emailSiteUrl("/admin/merchandise-orders"),
          ctaLabel: "View merchandise orders",
        },
      });
    }

    return NextResponse.json({
      order: updated,
      message: "Receipt received. We'll verify your payment and confirm by email.",
    });
  } catch (error) {
    return jsonServerError("Failed to upload payment receipt", {
      route: "POST /api/merchandise-order/payment-proof",
      cause: error,
    });
  }
}

export async function DELETE(request: Request) {
  const paymentToken = new URL(request.url).searchParams.get("paymentToken");
  if (!paymentToken?.trim()) return jsonError("Invalid payment link", 400);
  try {
    const order = await prisma.merchandiseOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });
    if (!order) return jsonError("Merchandise order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This merchandise order is already paid", 400);
    }
    if (!order.proofScreenshotUrl || !order.proofSubmittedAt) {
      return jsonError("No screenshot to remove", 400);
    }
    await deleteMerchandiseOrderProofFile(order.proofScreenshotUrl);
    const updated = await prisma.merchandiseOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl: null,
        proofSubmittedAt: null,
        paymentStatus: "AWAITING",
      },
    });
    return NextResponse.json({
      order: updated,
      message: "Screenshot removed. You can upload a new one.",
    });
  } catch (error) {
    return jsonServerError("Failed to remove payment receipt", {
      route: "DELETE /api/merchandise-order/payment-proof",
      cause: error,
    });
  }
}
