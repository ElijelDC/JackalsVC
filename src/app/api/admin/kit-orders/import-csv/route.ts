import { jsonError, requireAdmin } from "@/lib/api";
import { reconcileFromCsv } from "@/lib/payment-csv-reconcile";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { response: authError } = await requireAdmin();
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("CSV file required", 400);
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".csv")) {
      return jsonError("Please upload a CSV file exported from your bank or SumUp account", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return jsonError("CSV file must be smaller than 5 MB", 400);
    }

    const csvContent = await file.text();
    if (!csvContent.trim()) {
      return jsonError("CSV file is empty", 400);
    }

    const result = await reconcileFromCsv(csvContent, file.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Kit order CSV import failed:", error);
    return jsonError("Failed to import bank statement CSV", 500);
  }
}
