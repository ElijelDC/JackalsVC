import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getVapidPublicKey, isWebPushConfigured } from "@/lib/web-push";

export async function GET() {
  if (!isWebPushConfigured()) {
    return jsonError("Push notifications are not configured", 503);
  }

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return jsonError("Push notifications are not configured", 503);
  }

  return NextResponse.json({ publicKey });
}
