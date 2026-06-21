import { auth } from "@/auth";
import { jsonError } from "@/lib/api";
import { isSumUpConfigured } from "@/lib/sumup";
import { reconcilePendingPayments } from "@/lib/sumup-reconcile";
import { NextResponse } from "next/server";

async function authorizeSync(request: Request) {
  const syncSecret = process.env.PAYMENTS_SYNC_SECRET?.trim();
  const headerSecret = request.headers.get("x-payments-sync-secret");

  if (syncSecret && headerSecret === syncSecret) {
    return true;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(request: Request) {
  if (!(await authorizeSync(request))) {
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
