import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import {
  exportBulkImportExcel,
  getBulkImportTemplateMeta,
  isBulkImportType,
  runBulkImport,
} from "@/lib/bulk-import";
import {
  excelContentType,
  isSpreadsheetFileName,
  parseSpreadsheetTable,
} from "@/lib/spreadsheet-table";

type RouteContext = {
  params: Promise<{ type: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { type } = await context.params;
  if (!isBulkImportType(type)) {
    return jsonError("Unknown import type", 404);
  }

  const meta = getBulkImportTemplateMeta(type);
  const buffer = await exportBulkImportExcel(type);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": excelContentType(),
      "Content-Disposition": `attachment; filename="${meta.fileName}"`,
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { type } = await context.params;
  if (!isBulkImportType(type)) {
    return jsonError("Unknown import type", 404);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Excel file required", 400);
    }

    if (!isSpreadsheetFileName(file.name)) {
      return jsonError("Please upload an Excel (.xlsx) file", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File must be smaller than 5 MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows } = await parseSpreadsheetTable(buffer, file.name);
    if (rows.length === 0) {
      return jsonError("Spreadsheet is empty", 400);
    }

    const result = await runBulkImport(type, rows, file.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Bulk import failed (${type}):`, error);
    const message =
      error instanceof Error ? error.message : "Failed to import spreadsheet";
    if (
      message.includes("upload") ||
      message.includes("Excel") ||
      message.includes("CSV")
    ) {
      return jsonError(message, 400);
    }
    return jsonError("Failed to import spreadsheet", 500);
  }
}
