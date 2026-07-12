import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { authorizePrivilegedSyncRequest } from "@/lib/cron-auth";
import { isSumUpConfigured } from "@/lib/sumup";
import { reconcilePendingPayments } from "@/lib/sumup-reconcile";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (
    !(await authorizePrivilegedSyncRequest(
      request,
      "x-payments-sync-secret",
      "PAYMENTS_SYNC_SECRET",
    ))
  ) {
    return jsonError("Unauthorized", 401);
  }

  if (!isSumUpConfigured()) {
    return jsonError(
      "SumUp is not configured. Add SUMUP_API_KEY and SUMUP_MERCHANT_CODE to your environment.",
      503,
    );
  }

  try {
    const result = await reconcilePendingPayments();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync payments";
    return jsonError(message, 500);
  }
}
