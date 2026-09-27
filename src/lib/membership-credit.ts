import type { PrismaClient } from "@/generated/prisma/client";
import {
  applyMembershipCreditToAmounts,
  roundEur,
  withMembershipCreditNote,
} from "@/lib/membership-credit-config";
import { prisma } from "@/lib/prisma";

export {
  applyMembershipCreditToAmounts,
  roundEur,
} from "@/lib/membership-credit-config";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Apply the user's stored membership credit to their next unpaid
 * (PENDING) membership payments. Never touches COMPLETED payments.
 */
export async function applyUserMembershipCredit(
  tx: TxClient | typeof prisma,
  userId: string,
): Promise<{ appliedEur: number; remainingCreditEur: number }> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      membershipCreditEur: true,
      membershipCreditNote: true,
    },
  });

  const creditEur = roundEur(user?.membershipCreditEur ?? 0);
  if (!user || creditEur <= 0) {
    return { appliedEur: 0, remainingCreditEur: creditEur };
  }

  const pending = await tx.payment.findMany({
    where: {
      userId,
      membershipId: { not: null },
      status: "PENDING",
    },
    orderBy: [
      { dueDate: "asc" },
      { installmentNumber: "asc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      amount: true,
      description: true,
    },
  });

  if (pending.length === 0) {
    return { appliedEur: 0, remainingCreditEur: creditEur };
  }

  const { amounts, appliedEur } = applyMembershipCreditToAmounts(
    pending.map((payment) => payment.amount),
    creditEur,
  );

  if (appliedEur <= 0) {
    return { appliedEur: 0, remainingCreditEur: creditEur };
  }

  let creditLeft = creditEur;
  const now = new Date();

  for (let i = 0; i < pending.length; i += 1) {
    const payment = pending[i]!;
    const nextAmount = amounts[i]!;
    const reducedBy = roundEur(payment.amount - nextAmount);
    if (reducedBy <= 0) continue;

    creditLeft = roundEur(creditLeft - reducedBy);

    if (nextAmount <= 0) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: 0,
          status: "COMPLETED",
          paidAt: now,
          description: withMembershipCreditNote(payment.description, reducedBy),
        },
      });
    } else {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: nextAmount,
          description: withMembershipCreditNote(payment.description, reducedBy),
        },
      });
    }
  }

  const remainingCreditEur = Math.max(0, creditLeft);
  await tx.user.update({
    where: { id: userId },
    data: { membershipCreditEur: remainingCreditEur },
  });

  return { appliedEur, remainingCreditEur };
}
