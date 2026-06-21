import { prisma } from "@/lib/prisma";
import {
  amountsMatch,
  completeMatchedPayment,
  referenceMatchesText,
} from "@/lib/payment-match";
import { parseBankTransferCsv, type ParsedBankTransferRow } from "@/lib/payment-csv-parse";

export type CsvImportResult = {
  matched: number;
  scanned: number;
  skippedDuplicates: number;
  unmatchedRows: number;
  unmatchedPayments: number;
  fileName?: string;
};

async function matchRowToPayment(
  row: ParsedBankTransferRow,
  pendingPayments: Array<{
    id: string;
    amount: number;
    paymentReference: string;
  }>,
  usedPaymentIds: Set<string>,
) {
  return pendingPayments.find(
    (payment) =>
      !usedPaymentIds.has(payment.id) &&
      amountsMatch(payment.amount, row.amount) &&
      (referenceMatchesText(row.reference, payment.paymentReference) ||
        referenceMatchesText(row.rawLine, payment.paymentReference)),
  );
}

export async function reconcileFromCsv(
  csvContent: string,
  fileName?: string,
): Promise<CsvImportResult> {
  const rows = parseBankTransferCsv(csvContent);
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  if (rows.length === 0) {
    return {
      matched: 0,
      scanned: 0,
      skippedDuplicates: 0,
      unmatchedRows: 0,
      unmatchedPayments: pendingPayments.length,
      fileName,
    };
  }

  const usedPaymentIds = new Set<string>();
  let matched = 0;
  let skippedDuplicates = 0;
  let unmatchedRows = 0;

  for (const row of rows) {
    const existing = await prisma.paymentImportRecord.findUnique({
      where: { rowKey: row.rowKey },
    });

    if (existing) {
      skippedDuplicates += 1;
      continue;
    }

    const payment = await matchRowToPayment(row, pendingPayments, usedPaymentIds);

    if (!payment) {
      unmatchedRows += 1;
      await prisma.paymentImportRecord.create({
        data: {
          rowKey: row.rowKey,
          fileName: fileName ?? null,
          amount: row.amount,
          reference: row.reference,
          transactionDate: row.transactionDate ?? null,
          status: "NO_MATCH",
        },
      });
      continue;
    }

    usedPaymentIds.add(payment.id);

    await completeMatchedPayment(payment.id, {
      externalId: `csv:${row.rowKey}`,
      externalCode: row.reference,
      paidAt: row.transactionDate,
    });

    await prisma.paymentImportRecord.create({
      data: {
        rowKey: row.rowKey,
        fileName: fileName ?? null,
        amount: row.amount,
        reference: row.reference,
        transactionDate: row.transactionDate ?? null,
        matchedPaymentId: payment.id,
        status: "MATCHED",
      },
    });

    matched += 1;
  }

  const unmatchedPayments = await prisma.payment.count({ where: { status: "PENDING" } });

  return {
    matched,
    scanned: rows.length,
    skippedDuplicates,
    unmatchedRows,
    unmatchedPayments,
    fileName,
  };
}
