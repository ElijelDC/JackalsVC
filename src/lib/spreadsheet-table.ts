import ExcelJS from "exceljs";
import { normalizeCsvHeader, parseCsvLine, parseCsvTable } from "@/lib/csv-utils";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function isSpreadsheetFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".csv");
}

export function isExcelFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".xlsx");
}

export function excelContentType(): string {
  return EXCEL_MIME;
}

function toNodeBuffer(buffer: ArrayBuffer | Buffer): Buffer {
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    if (hours === "00" && minutes === "00" && value.getSeconds() === 0) {
      return `${year}-${month}-${day}`;
    }
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
    if ("text" in value && value.text != null) {
      return String(value.text).trim();
    }
    if ("result" in value) {
      return cellToString(value.result as ExcelJS.CellValue);
    }
  }
  return String(value).trim();
}

/** Read the first worksheet into a raw string matrix (including header row). */
export async function parseExcelMatrix(
  buffer: ArrayBuffer | Buffer,
): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  // ExcelJS accepts Buffer / ArrayBuffer / Uint8Array depending on runtime.
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const matrix: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      while (cells.length < colNumber - 1) cells.push("");
      cells.push(cellToString(cell.value));
    });
    if (cells.some((cell) => cell.length > 0)) {
      matrix.push(cells);
    }
  });

  return matrix;
}

export function matrixToTable(matrix: string[][]): {
  headers: string[];
  rows: Record<string, string>[];
} {
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = matrix[0]!.map(normalizeCsvHeader);
  const rows = matrix.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });

  return { headers, rows };
}

export async function parseSpreadsheetTable(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseCsvTable(toNodeBuffer(buffer).toString("utf8"));
  }
  if (lower.endsWith(".xlsx")) {
    return matrixToTable(await parseExcelMatrix(buffer));
  }
  throw new Error("Please upload an Excel (.xlsx) or CSV file");
}

export async function parseSpreadsheetMatrix(
  buffer: ArrayBuffer | Buffer,
  fileName: string,
): Promise<string[][]> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) {
    return toNodeBuffer(buffer)
      .toString("utf8")
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => parseCsvLine(line));
  }
  if (lower.endsWith(".xlsx")) {
    return parseExcelMatrix(buffer);
  }
  throw new Error("Please upload an Excel (.xlsx) or CSV file");
}

/** Build an .xlsx workbook with all cells stored as text (avoids date/time mangling). */
export async function buildExcelTableBuffer(
  sheetName: string,
  headers: string[],
  rows: string[][],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jackals VC";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.numFmt = "@";
  });

  for (const row of rows) {
    const excelRow = sheet.addRow(row.map((value) => String(value ?? "")));
    excelRow.eachCell((cell) => {
      cell.numFmt = "@";
    });
  }

  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = Math.min(36, Math.max(14, header.length + 2));
    column.numFmt = "@";
  });

  if (rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: headers.length },
    };
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
