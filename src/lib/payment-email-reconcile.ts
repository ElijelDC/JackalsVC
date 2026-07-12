import { prisma } from "@/lib/prisma";
import {
  amountsMatch,
  completeMatchedPayment,
  referenceMatchesText,
} from "@/lib/payment-match";
import {
  getEmailSearchText,
  isLikelySumUpPaymentEmail,
  parseIncomingPaymentEmail,
} from "@/lib/payment-email-parse";

export type EmailReconcileResult = {
  status: "MATCHED" | "NO_MATCH" | "SKIPPED" | "DUPLICATE";
  messageId: string;
  matchedPaymentId?: string;
  parsedAmount?: number;
  parsedReference?: string;
};

function isSenderAllowed(from: string): boolean {
  const allowed = process.env.PAYMENT_EMAIL_ALLOWED_SENDERS?.trim();
  if (!allowed) {
    return process.env.NODE_ENV !== "production";
  }

  const fromLower = from.toLowerCase();
  return allowed
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .some((entry) => fromLower.includes(entry));
}

export function isPaymentEmailConfigured(): boolean {
  return Boolean(process.env.PAYMENT_EMAIL_WEBHOOK_SECRET?.trim());
}

export async function reconcileFromEmail(input: {
  messageId: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<EmailReconcileResult> {
  const existing = await prisma.processedPaymentEmail.findUnique({
    where: { messageId: input.messageId },
  });

  if (existing) {
    return {
      status: "DUPLICATE",
      messageId: input.messageId,
      matchedPaymentId: existing.matchedPaymentId ?? undefined,
      parsedAmount: existing.parsedAmount ?? undefined,
      parsedReference: existing.parsedReference ?? undefined,
    };
  }

  const from = input.from ?? "";
  const searchText = getEmailSearchText(input.subject, input.text, input.html);

  if (!isSenderAllowed(from) || !isLikelySumUpPaymentEmail(from, input.subject)) {
    await prisma.processedPaymentEmail.create({
      data: {
        messageId: input.messageId,
        fromAddress: from || null,
        subject: input.subject,
        status: "SKIPPED",
      },
    });

    return { status: "SKIPPED", messageId: input.messageId };
  }

  const parsed = parseIncomingPaymentEmail(input.subject, input.text, input.html);

  if (!parsed) {
    await prisma.processedPaymentEmail.create({
      data: {
        messageId: input.messageId,
        fromAddress: from || null,
        subject: input.subject,
        status: "NO_MATCH",
      },
    });

    return { status: "NO_MATCH", messageId: input.messageId };
  }

  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  const match = pendingPayments.find(
    (payment) =>
      amountsMatch(payment.amount, parsed.amount) &&
      (referenceMatchesText(searchText, payment.paymentReference) ||
        referenceMatchesText(parsed.reference, payment.paymentReference)),
  );

  if (!match) {
    await prisma.processedPaymentEmail.create({
      data: {
        messageId: input.messageId,
        fromAddress: from || null,
        subject: input.subject,
        parsedAmount: parsed.amount,
        parsedReference: parsed.reference,
        status: "NO_MATCH",
      },
    });

    return {
      status: "NO_MATCH",
      messageId: input.messageId,
      parsedAmount: parsed.amount,
      parsedReference: parsed.reference,
    };
  }

  await completeMatchedPayment(match.id, {
    externalId: `email:${input.messageId}`,
    externalCode: parsed.reference,
    paidAt: parsed.receivedAt,
  });

  await prisma.processedPaymentEmail.create({
    data: {
      messageId: input.messageId,
      fromAddress: from || null,
      subject: input.subject,
      parsedAmount: parsed.amount,
      parsedReference: parsed.reference,
      matchedPaymentId: match.id,
      status: "MATCHED",
    },
  });

  return {
    status: "MATCHED",
    messageId: input.messageId,
    matchedPaymentId: match.id,
    parsedAmount: parsed.amount,
    parsedReference: parsed.reference,
  };
}
