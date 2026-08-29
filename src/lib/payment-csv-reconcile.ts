import { completeKitOrderPayment } from "@/lib/complete-kit-order-payment";
import { completeMerchandiseOrderPayment } from "@/lib/complete-merchandise-order-payment";
import {
  buildKitOrderPaymentQuote,
  buildKitOrderPaymentReference,
} from "@/lib/kit-order-payment-summary";
import { prisma } from "@/lib/prisma";
import {
  amountsMatch,
  completeMatchedPayment,
  referenceMatchesText,
} from "@/lib/payment-match";
import { parseBankTransferCsv, type ParsedBankTransferRow } from "@/lib/payment-csv-parse";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import {
  buildMerchandiseOrderPaymentQuote,
  buildMerchandiseOrderPaymentReference,
} from "@/lib/merchandise-order-payment-summary";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";

export type BankStatementImportResult = {
  matched: number;
  matchedMembership: number;
  matchedKitOrders: number;
  matchedMerchandiseOrders: number;
  scanned: number;
  skippedDuplicates: number;
  unmatchedRows: number;
  unmatchedPayments: number;
  unmatchedKitOrders: number;
  unmatchedMerchandiseOrders: number;
  fileName?: string;
};

/** @deprecated Use BankStatementImportResult */
export type CsvImportResult = BankStatementImportResult;

type MatchablePayment = {
  id: string;
  amount: number;
  paymentReference: string;
};

type MatchableKitOrder = {
  id: string;
  amount: number;
  paymentReference: string;
};

type MatchableMerchandiseOrder = MatchableKitOrder;

function matchRowToPayment(
  row: ParsedBankTransferRow,
  pendingPayments: MatchablePayment[],
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

function matchRowToKitOrder(
  row: ParsedBankTransferRow,
  pendingKitOrders: MatchableKitOrder[],
  usedKitOrderIds: Set<string>,
) {
  return pendingKitOrders.find(
    (order) =>
      !usedKitOrderIds.has(order.id) &&
      amountsMatch(order.amount, row.amount) &&
      (referenceMatchesText(row.reference, order.paymentReference) ||
        referenceMatchesText(row.rawLine, order.paymentReference)),
  );
}

function matchRowToMerchandiseOrder(
  row: ParsedBankTransferRow,
  pendingOrders: MatchableMerchandiseOrder[],
  usedIds: Set<string>,
) {
  return pendingOrders.find(
    (order) =>
      !usedIds.has(order.id) &&
      amountsMatch(order.amount, row.amount) &&
      (referenceMatchesText(row.reference, order.paymentReference) ||
        referenceMatchesText(row.rawLine, order.paymentReference)),
  );
}

async function loadPendingKitOrders(): Promise<MatchableKitOrder[]> {
  const rows = await prisma.kitOrder.findMany({
    where: { paymentStatus: { not: "PAID" } },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => {
    const order = serializeKitOrder(row);
    return {
      id: row.id,
      amount: buildKitOrderPaymentQuote(order).totalEur,
      paymentReference: buildKitOrderPaymentReference(order),
    };
  });
}

async function loadPendingMerchandiseOrders(): Promise<
  MatchableMerchandiseOrder[]
> {
  const rows = await prisma.merchandiseOrder.findMany({
    where: { paymentStatus: { not: "PAID" } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => {
    const order = serializeMerchandiseOrder(row);
    return {
      id: row.id,
      amount: buildMerchandiseOrderPaymentQuote(order).totalEur,
      paymentReference: buildMerchandiseOrderPaymentReference(order),
    };
  });
}

export async function reconcileFromCsv(
  csvContent: string,
  fileName?: string,
): Promise<BankStatementImportResult> {
  const rows = parseBankTransferCsv(csvContent);
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
  const pendingKitOrders = await loadPendingKitOrders();
  const pendingMerchandiseOrders = await loadPendingMerchandiseOrders();

  if (rows.length === 0) {
    return {
      matched: 0,
      matchedMembership: 0,
      matchedKitOrders: 0,
      matchedMerchandiseOrders: 0,
      scanned: 0,
      skippedDuplicates: 0,
      unmatchedRows: 0,
      unmatchedPayments: pendingPayments.length,
      unmatchedKitOrders: pendingKitOrders.length,
      unmatchedMerchandiseOrders: pendingMerchandiseOrders.length,
      fileName,
    };
  }

  const usedPaymentIds = new Set<string>();
  const usedKitOrderIds = new Set<string>();
  const usedMerchandiseOrderIds = new Set<string>();
  let matchedMembership = 0;
  let matchedKitOrders = 0;
  let matchedMerchandiseOrders = 0;
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

    const payment = matchRowToPayment(row, pendingPayments, usedPaymentIds);

    if (payment) {
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

      matchedMembership += 1;
      continue;
    }

    const kitOrder = matchRowToKitOrder(row, pendingKitOrders, usedKitOrderIds);

    if (kitOrder) {
      usedKitOrderIds.add(kitOrder.id);

      await completeKitOrderPayment(kitOrder.id);

      await prisma.paymentImportRecord.create({
        data: {
          rowKey: row.rowKey,
          fileName: fileName ?? null,
          amount: row.amount,
          reference: row.reference,
          transactionDate: row.transactionDate ?? null,
          matchedKitOrderId: kitOrder.id,
          status: "KIT_MATCHED",
        },
      });

      matchedKitOrders += 1;
      continue;
    }

    const merchandiseOrder = matchRowToMerchandiseOrder(
      row,
      pendingMerchandiseOrders,
      usedMerchandiseOrderIds,
    );

    if (merchandiseOrder) {
      usedMerchandiseOrderIds.add(merchandiseOrder.id);
      await completeMerchandiseOrderPayment(merchandiseOrder.id);
      await prisma.paymentImportRecord.create({
        data: {
          rowKey: row.rowKey,
          fileName: fileName ?? null,
          amount: row.amount,
          reference: row.reference,
          transactionDate: row.transactionDate ?? null,
          matchedMerchandiseOrderId: merchandiseOrder.id,
          status: "MERCH_MATCHED",
        },
      });
      matchedMerchandiseOrders += 1;
      continue;
    }

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
  }

  const unmatchedPayments = await prisma.payment.count({ where: { status: "PENDING" } });
  const unmatchedKitOrders = await prisma.kitOrder.count({
    where: { paymentStatus: { not: "PAID" } },
  });
  const unmatchedMerchandiseOrders = await prisma.merchandiseOrder.count({
    where: { paymentStatus: { not: "PAID" } },
  });

  return {
    matched: matchedMembership + matchedKitOrders + matchedMerchandiseOrders,
    matchedMembership,
    matchedKitOrders,
    matchedMerchandiseOrders,
    scanned: rows.length,
    skippedDuplicates,
    unmatchedRows,
    unmatchedPayments,
    unmatchedKitOrders,
    unmatchedMerchandiseOrders,
    fileName,
  };
}
