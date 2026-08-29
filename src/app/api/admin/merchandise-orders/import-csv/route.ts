import { NextResponse } from "next/server";
import { jsonError, requireAdmin } from "@/lib/api";
import { reconcileFromCsv } from "@/lib/payment-csv-reconcile";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return jsonError("CSV file required", 400);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return jsonError("Please upload a CSV file", 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return jsonError("CSV file must be smaller than 5 MB", 400);
    }
    const csv = await file.text();
    if (!csv.trim()) return jsonError("CSV file is empty", 400);
    return NextResponse.json(await reconcileFromCsv(csv, file.name));
  } catch (error) {
    console.error("Merchandise order CSV import failed:", error);
    return jsonError("Failed to import bank statement CSV", 500);
  }
}
