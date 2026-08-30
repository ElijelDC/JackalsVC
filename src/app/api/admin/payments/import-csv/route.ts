import { jsonError, requireAdmin } from "@/lib/api";
import { reconcileFromSpreadsheet } from "@/lib/payment-csv-reconcile";
import { isSpreadsheetFileName } from "@/lib/spreadsheet-table";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Spreadsheet file required", 400);
    }

    if (!isSpreadsheetFileName(file.name)) {
      return jsonError(
        "Please upload an Excel (.xlsx) or CSV file from your bank or SumUp account",
        400,
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("File must be smaller than 5 MB", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await reconcileFromSpreadsheet(buffer, file.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Payment spreadsheet import failed:", error);
    const message =
      error instanceof Error && error.message.includes("upload")
        ? error.message
        : "Failed to import bank statement";
    return jsonError(message, 500);
  }
}
