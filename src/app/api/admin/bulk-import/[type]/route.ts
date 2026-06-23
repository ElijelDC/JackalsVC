import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import {
  exportBulkImportCsv,
  getBulkImportTemplateMeta,
  isBulkImportType,
  runBulkImport,
} from "@/lib/bulk-import";

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
  const csv = await exportBulkImportCsv(type);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
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
      return jsonError("CSV file required", 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      return jsonError("Please upload a CSV file", 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      return jsonError("CSV file must be smaller than 2 MB", 400);
    }

    const csvContent = await file.text();
    if (!csvContent.trim()) {
      return jsonError("CSV file is empty", 400);
    }

    const result = await runBulkImport(type, csvContent, file.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Bulk import failed (${type}):`, error);
    return jsonError("Failed to import CSV", 500);
  }
}
