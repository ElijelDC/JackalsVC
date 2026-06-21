import { parsePaymentReference } from "@/lib/payments";

const SUMUP_API_BASE = "https://api.sumup.com";

export type SumUpTransaction = {
  id: string;
  transaction_code?: string;
  client_transaction_id?: string;
  foreign_transaction_id?: string;
  checkout_reference?: string;
  amount: number;
  currency?: string;
  timestamp?: string;
  status?: string;
  simple_status?: string;
  product_summary?: string;
  payment_type?: string;
  process_as?: string;
};

type SumUpTransactionHistoryResponse = {
  items?: SumUpTransaction[];
};

function getSumUpConfig() {
  const apiKey = process.env.SUMUP_API_KEY?.trim();
  const merchantCode = process.env.SUMUP_MERCHANT_CODE?.trim();

  if (!apiKey || !merchantCode) {
    return null;
  }

  return { apiKey, merchantCode };
}

export function isSumUpConfigured(): boolean {
  return getSumUpConfig() !== null;
}

async function sumUpFetch<T>(path: string): Promise<T> {
  const config = getSumUpConfig();
  if (!config) {
    throw new Error("SumUp is not configured. Set SUMUP_API_KEY and SUMUP_MERCHANT_CODE.");
  }

  const response = await fetch(`${SUMUP_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SumUp API error (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function listSumUpTransactions(options?: {
  oldestTime?: Date;
  newestTime?: Date;
  limit?: number;
}): Promise<SumUpTransaction[]> {
  const config = getSumUpConfig();
  if (!config) {
    throw new Error("SumUp is not configured. Set SUMUP_API_KEY and SUMUP_MERCHANT_CODE.");
  }

  const pageSize = Math.min(options?.limit ?? 100, 100);
  const collected: SumUpTransaction[] = [];
  let oldestTime = options?.oldestTime;

  while (collected.length < (options?.limit ?? 200)) {
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    params.set("order", "descending");

    if (options?.newestTime) {
      params.set("newest_time", options.newestTime.toISOString());
    }

    if (oldestTime) {
      params.set("oldest_time", oldestTime.toISOString());
    }

    const data = await sumUpFetch<SumUpTransactionHistoryResponse>(
      `/v2.1/merchants/${config.merchantCode}/transactions/history?${params}`,
    );

    const items = data.items ?? [];
    if (items.length === 0) break;

    collected.push(...items);

    if (items.length < pageSize) break;

    const lastTimestamp = items.at(-1)?.timestamp;
    if (!lastTimestamp) break;

    oldestTime = new Date(lastTimestamp);
  }

  return collected.slice(0, options?.limit ?? 200);
}

export async function getSumUpTransaction(id: string): Promise<SumUpTransaction | null> {
  const config = getSumUpConfig();
  if (!config) return null;

  try {
    const params = new URLSearchParams({ id });
    return await sumUpFetch<SumUpTransaction>(
      `/v2.1/merchants/${config.merchantCode}/transactions?${params}`,
    );
  } catch {
    return null;
  }
}

export function normalizeMatchText(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function getTransactionSearchText(transaction: SumUpTransaction): string {
  return normalizeMatchText(
    [
      transaction.product_summary,
      transaction.client_transaction_id,
      transaction.foreign_transaction_id,
      transaction.checkout_reference,
      transaction.transaction_code,
      transaction.id,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

export function isSuccessfulSumUpTransaction(transaction: SumUpTransaction): boolean {
  const status = (transaction.simple_status ?? transaction.status)?.toUpperCase();
  return (
    !status ||
    status === "SUCCESSFUL" ||
    status === "PAID" ||
    status === "PAID_OUT"
  );
}

export function isIncomingBusinessAccountCredit(transaction: SumUpTransaction): boolean {
  if (!isSuccessfulSumUpTransaction(transaction)) return false;

  const paymentType = transaction.payment_type?.toUpperCase();
  const processAs = transaction.process_as?.toUpperCase();

  if (paymentType === "BALANCE" && processAs === "CREDIT") {
    return true;
  }

  // Some incoming SEPA transfers may be classified differently — still allow
  // reference-based matching when the transaction is successful.
  return isSuccessfulSumUpTransaction(transaction);
}

export function transactionContainsReference(
  transaction: SumUpTransaction,
  paymentReference: string,
): boolean {
  const haystack = getTransactionSearchText(transaction);
  const fullReference = normalizeMatchText(paymentReference);

  if (haystack.includes(fullReference)) {
    return true;
  }

  const { memberName } = parsePaymentReference(paymentReference);
  const normalizedName = normalizeMatchText(memberName);

  return normalizedName.length >= 3 && haystack.includes(normalizedName);
}
