import { jsonError, jsonServerError } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { emailSiteUrl, notifyAdmins } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { SPECIAL_ORDER_TOTAL_EUR, specialOrderFullName } from "@/lib/special-order-config";
import {
  deleteSpecialOrderProofFile,
  saveSpecialOrderProofFile,
  validateSpecialOrderProofFile,
} from "@/lib/special-order-payment-proof";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";
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
    const fileError = validateSpecialOrderProofFile(screenshot);
    if (fileError) return jsonError(fileError, 400);

    const order = await prisma.specialOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });
    if (!order) return jsonError("Special order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This special order is already paid", 400);
    }
    if (order.proofScreenshotUrl) {
      await deleteSpecialOrderProofFile(order.proofScreenshotUrl);
    }
    const proofScreenshotUrl = await saveSpecialOrderProofFile(
      order.id,
      screenshot,
    );
    const updated = await prisma.specialOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl,
        proofSubmittedAt: new Date(),
        paymentStatus: "PROOF_SUBMITTED",
      },
    });

    if (isEmailConfigured()) {
      await notifyAdmins({
        subject: `Special order receipt — ${specialOrderFullName(order)}`,
        replyTo: order.email,
        content: {
          heading: "Special order payment receipt",
          paragraphs: [
            `${specialOrderFullName(order)} uploaded a bank transfer screenshot.`,
          ],
          details: [
            { label: "Email", value: order.email },
            { label: "Amount", value: `€${SPECIAL_ORDER_TOTAL_EUR}` },
          ],
          imageUrl: emailSiteUrl(proofScreenshotUrl),
          imageAlt: "Special order payment receipt",
          ctaUrl: emailSiteUrl("/admin/special-orders"),
          ctaLabel: "View special orders",
        },
      });
    }

    return NextResponse.json({
      order: serializeSpecialOrder(updated),
      message: "Receipt received. We'll verify your payment and confirm by email.",
    });
  } catch (error) {
    return jsonServerError("Failed to upload payment receipt", {
      route: "POST /api/special-order/payment-proof",
      cause: error,
    });
  }
}

export async function DELETE(request: Request) {
  const paymentToken = new URL(request.url).searchParams.get("paymentToken");
  if (!paymentToken?.trim()) return jsonError("Invalid payment link", 400);
  try {
    const order = await prisma.specialOrder.findUnique({
      where: { paymentToken: paymentToken.trim() },
    });
    if (!order) return jsonError("Special order not found", 404);
    if (order.paymentStatus === "PAID") {
      return jsonError("This special order is already paid", 400);
    }
    if (!order.proofScreenshotUrl || !order.proofSubmittedAt) {
      return jsonError("No screenshot to remove", 400);
    }
    await deleteSpecialOrderProofFile(order.proofScreenshotUrl);
    const updated = await prisma.specialOrder.update({
      where: { id: order.id },
      data: {
        proofScreenshotUrl: null,
        proofSubmittedAt: null,
        paymentStatus: "AWAITING",
      },
    });
    return NextResponse.json({
      order: serializeSpecialOrder(updated),
      message: "Screenshot removed. You can upload a new one.",
    });
  } catch (error) {
    return jsonServerError("Failed to remove payment receipt", {
      route: "DELETE /api/special-order/payment-proof",
      cause: error,
    });
  }
}
