import { prisma } from "@/lib/prisma";
import { parsePaymentReference } from "@/lib/payments";
import { normalizeMatchText } from "@/lib/sumup";

export function amountsMatch(expected: number, received: number): boolean {
  return Math.abs(expected - received) < 0.01;
}

export function referenceMatchesText(text: string, paymentReference: string): boolean {
  const haystack = normalizeMatchText(text);
  const fullReference = normalizeMatchText(paymentReference);

  if (fullReference.length >= 3 && haystack.includes(fullReference)) {
    return true;
  }

  const { memberName } = parsePaymentReference(paymentReference);
  const normalizedName = normalizeMatchText(memberName);

  return normalizedName.length >= 3 && haystack.includes(normalizedName);
}

export async function completeMatchedPayment(
  paymentId: string,
  source: {
    externalId: string;
    externalCode?: string | null;
    paidAt?: Date;
  },
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "COMPLETED") return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "COMPLETED",
      paidAt: source.paidAt ?? new Date(),
      sumupTransactionId: source.externalId,
      sumupTransactionCode: source.externalCode ?? null,
      sumupMatchedAt: new Date(),
    },
  });

  if (!payment.membershipId) return;

  const paidCount = await prisma.payment.count({
    where: {
      membershipId: payment.membershipId,
      status: "COMPLETED",
    },
  });

  if (paidCount === 1) {
    await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { status: "ACTIVE" },
    });
  }
}
