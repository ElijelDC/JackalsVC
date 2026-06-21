import { jsonError } from "@/lib/api";
import {
  isPaymentEmailConfigured,
  reconcileFromEmail,
} from "@/lib/payment-email-reconcile";
import { NextResponse } from "next/server";

function authorizeEmailWebhook(request: Request): boolean {
  const secret = process.env.PAYMENT_EMAIL_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const headerSecret =
    request.headers.get("x-payment-email-secret") ??
    request.headers.get("x-payments-email-secret");

  return headerSecret === secret;
}

function readField(formData: FormData, ...keys: string[]): string {
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

async function parseEmailPayload(request: Request): Promise<{
  messageId: string;
  from: string;
  subject: string;
  text: string;
  html?: string;
} | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    const messageId =
      typeof body.messageId === "string"
        ? body.messageId
        : typeof body["Message-Id"] === "string"
          ? body["Message-Id"]
          : "";

    const subject = typeof body.subject === "string" ? body.subject : "";
    const text =
      typeof body.text === "string"
        ? body.text
        : typeof body["body-plain"] === "string"
          ? body["body-plain"]
          : typeof body.body === "string"
            ? body.body
            : "";

    const html =
      typeof body.html === "string"
        ? body.html
        : typeof body["body-html"] === "string"
          ? body["body-html"]
          : undefined;

    const from =
      typeof body.from === "string"
        ? body.from
        : typeof body.sender === "string"
          ? body.sender
          : "";

    if (!messageId || !subject || !text) return null;

    return { messageId, from, subject, text, html };
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const messageId = readField(formData, "messageId", "Message-Id", "message-id");
    const subject = readField(formData, "subject", "Subject");
    const text = readField(
      formData,
      "text",
      "body-plain",
      "stripped-text",
      "body",
    );
    const html = readField(formData, "html", "body-html") || undefined;
    const from = readField(formData, "from", "sender", "From");

    if (!messageId || !subject || !text) return null;

    return { messageId, from, subject, text, html: html || undefined };
  }

  return null;
}

export async function POST(request: Request) {
  if (!authorizeEmailWebhook(request)) {
    return jsonError("Unauthorized", 401);
  }

  if (!isPaymentEmailConfigured()) {
    return jsonError(
      "Payment email webhook is not configured. Set PAYMENT_EMAIL_WEBHOOK_SECRET.",
      503,
    );
  }

  try {
    const payload = await parseEmailPayload(request);
    if (!payload) {
      return jsonError(
        "Invalid email payload. Provide messageId, subject, and text/body-plain.",
        400,
      );
    }

    const result = await reconcileFromEmail(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment email webhook failed:", error);
    return jsonError("Failed to process payment email", 500);
  }
}
