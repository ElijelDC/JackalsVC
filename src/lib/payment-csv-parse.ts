import { parseCsvLine } from "@/lib/csv-utils";

export type ParsedBankTransferRow = {
  rowKey: string;
  amount: number;
  reference: string;
  transactionDate?: Date;
  rawLine: string;
};

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[€£$"\s]/g, "").replace(",", ".");
  if (!cleaned) return null;

  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? Math.abs(value) : null;
}

function parseDate(raw: string): Date | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function pickColumn(
  headers: string[],
  row: string[],
  candidates: string[],
): string {
  for (const candidate of candidates) {
    const index = headers.findIndex((header) => header.includes(candidate));
    if (index >= 0 && row[index]) return row[index]!;
  }
  return "";
}

function buildRowKey(amount: number, reference: string, transactionDate?: Date): string {
  const datePart = transactionDate ? transactionDate.toISOString().slice(0, 10) : "unknown-date";
  return `${datePart}|${amount.toFixed(2)}|${reference.trim().toLowerCase()}`;
}

function isIncomingRow(typeValue: string, amount: number, reference: string): boolean {
  const type = typeValue.toLowerCase();
  if (type.includes("debit") || type.includes("out") || type.includes("sent")) {
    return false;
  }
  if (type.includes("credit") || type.includes("in") || type.includes("received")) {
    return true;
  }

  return amount > 0 && reference.length >= 3;
}

export function parseBankTransferMatrix(matrix: string[][]): ParsedBankTransferRow[] {
  if (matrix.length === 0) return [];

  const firstCells = matrix[0]!;
  const hasHeader = firstCells.some((cell) =>
    /amount|reference|description|date|type|memo|details/i.test(cell),
  );

  const headers = hasHeader ? firstCells.map(normalizeHeader) : [];
  const dataRows = hasHeader ? matrix.slice(1) : matrix;
  const parsed: ParsedBankTransferRow[] = [];

  for (const cells of dataRows) {
    if (cells.every((cell) => !cell)) continue;

    const amountRaw = hasHeader
      ? pickColumn(headers, cells, ["amount", "value", "credit", "sum"])
      : cells.find((cell) => /€|\d+[.,]\d{2}/.test(cell)) ?? cells[1] ?? "";

    const referenceRaw = hasHeader
      ? pickColumn(headers, cells, [
          "reference",
          "description",
          "details",
          "memo",
          "message",
          "payment reference",
          "narrative",
        ])
      : cells.find((cell) => /[a-zA-Z]{3,}/.test(cell) && !/€|\d+[.,]\d{2}/.test(cell)) ??
        cells[0] ??
        "";

    const dateRaw = hasHeader
      ? pickColumn(headers, cells, ["date", "timestamp", "booking", "created", "time"])
      : cells.find((cell) => /\d{4}-\d{2}-\d{2}|\d{2}[./-]\d{2}/.test(cell)) ?? "";

    const typeRaw = hasHeader
      ? pickColumn(headers, cells, ["type", "direction", "transaction type"])
      : "";

    const amount = parseAmount(amountRaw);
    const reference = referenceRaw.trim();
    if (amount == null || amount <= 0 || reference.length < 3) continue;
    if (!isIncomingRow(typeRaw, amount, reference)) continue;

    const transactionDate = parseDate(dateRaw);
    parsed.push({
      rowKey: buildRowKey(amount, reference, transactionDate),
      amount,
      reference,
      transactionDate,
      rawLine: cells.join(","),
    });
  }

  return parsed;
}

export function parseBankTransferCsv(content: string): ParsedBankTransferRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  return parseBankTransferMatrix(lines.map((line) => parseCsvLine(line)));
}
