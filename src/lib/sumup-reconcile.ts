import { prisma } from "@/lib/prisma";
import { buildPaymentReference } from "@/lib/payments";
import { amountsMatch, completeMatchedPayment } from "@/lib/payment-match";
import { CLUB_MEMBERSHIP_PLAN_NAME } from "@/lib/membership-config";
import {
  getSumUpTransaction,
  isIncomingBusinessAccountCredit,
  listSumUpTransactions,
  transactionContainsReference,
  type SumUpTransaction,
} from "@/lib/sumup";

export type ReconcileResult = {
  matched: number;
  scanned: number;
  unmatchedPayments: number;
  businessAccountCredits: number;
};

async function enrichTransaction(transaction: SumUpTransaction): Promise<SumUpTransaction> {
  if (transaction.product_summary) return transaction;
  const detailed = await getSumUpTransaction(transaction.id);
  return detailed ?? transaction;
}

function findMatchingTransaction(
  payment: { paymentReference: string; amount: number; dueDate: Date | null },
  transactions: SumUpTransaction[],
  usedTransactionIds: Set<string>,
): SumUpTransaction | null {
  for (const transaction of transactions) {
    if (usedTransactionIds.has(transaction.id)) continue;
    if (!isIncomingBusinessAccountCredit(transaction)) continue;
    if (!amountsMatch(payment.amount, transaction.amount)) continue;
    if (!transactionContainsReference(transaction, payment.paymentReference)) continue;

    return transaction;
  }

  return null;
}

async function findMatchingTransactionWithDetails(
  payment: { paymentReference: string; amount: number; dueDate: Date | null },
  transactions: SumUpTransaction[],
  usedTransactionIds: Set<string>,
): Promise<SumUpTransaction | null> {
  const directMatch = findMatchingTransaction(payment, transactions, usedTransactionIds);
  if (directMatch) return directMatch;

  const candidates = transactions.filter((transaction) => {
    if (usedTransactionIds.has(transaction.id)) return false;
    if (!isIncomingBusinessAccountCredit(transaction)) return false;
    if (transaction.payment_type?.toUpperCase() !== "BALANCE") return false;
    return amountsMatch(payment.amount, transaction.amount);
  });

  for (const candidate of candidates) {
    const detailed = await enrichTransaction(candidate);
    if (!transactionContainsReference(detailed, payment.paymentReference)) continue;
    return detailed;
  }

  return null;
}

export async function reconcilePendingPayments(): Promise<ReconcileResult> {
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  if (pendingPayments.length === 0) {
    return { matched: 0, scanned: 0, unmatchedPayments: 0, businessAccountCredits: 0 };
  }

  const oldestDue =
    pendingPayments.reduce<Date | null>((oldest, payment) => {
      const candidate = payment.dueDate ?? payment.createdAt;
      if (!oldest || candidate < oldest) return candidate;
      return oldest;
    }, null) ?? new Date();

  const lookbackStart = new Date(oldestDue);
  lookbackStart.setDate(lookbackStart.getDate() - 30);

  const transactions = await listSumUpTransactions({
    oldestTime: lookbackStart,
    newestTime: new Date(),
    limit: 300,
  });

  const businessAccountCredits = transactions.filter(
    (transaction) =>
      transaction.payment_type?.toUpperCase() === "BALANCE" &&
      transaction.process_as?.toUpperCase() === "CREDIT",
  ).length;

  const usedTransactionIds = new Set(
    (
      await prisma.payment.findMany({
        where: { sumupTransactionId: { not: null } },
        select: { sumupTransactionId: true },
      })
    )
      .map((payment) => payment.sumupTransactionId)
      .filter(Boolean) as string[],
  );

  let matched = 0;

  for (const payment of pendingPayments) {
    const transaction = await findMatchingTransactionWithDetails(
      payment,
      transactions,
      usedTransactionIds,
    );
    if (!transaction) continue;

    usedTransactionIds.add(transaction.id);

    await completeMatchedPayment(payment.id, {
      externalId: transaction.id,
      externalCode: transaction.transaction_code ?? null,
      paidAt: transaction.timestamp ? new Date(transaction.timestamp) : new Date(),
    });

    matched += 1;
  }

  return {
    matched,
    scanned: transactions.length,
    unmatchedPayments: pendingPayments.length - matched,
    businessAccountCredits,
  };
}

export async function createMembershipPayments(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: {
    userId: string;
    memberName: string;
    membershipId: string;
    scheduleLabel: string;
    installments: Array<{
      installmentNumber: number;
      amount: number;
      dueDate: Date;
      description: string;
    }>;
  },
) {
  await tx.payment.createMany({
    data: input.installments.map((installment) => ({
      userId: input.userId,
      membershipId: input.membershipId,
      amount: installment.amount,
      description: `${CLUB_MEMBERSHIP_PLAN_NAME} · ${input.scheduleLabel} · ${installment.description}`,
      status: "PENDING",
      method: "BANK_TRANSFER",
      installmentNumber: installment.installmentNumber,
      dueDate: installment.dueDate,
      paymentReference: buildPaymentReference(
        input.memberName,
        installment.dueDate,
        installment.installmentNumber,
        input.installments.length,
      ),
    })),
  });
}
