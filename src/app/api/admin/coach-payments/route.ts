import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api";
import { getAdminCoachPaymentRows } from "@/lib/admin-coach-payments";
import { COACH_SESSION_RATE_EUR } from "@/lib/coach-payments-config";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const coaches = await getAdminCoachPaymentRows({
    monthsBack: 12,
    monthsAhead: 6,
  });

  return NextResponse.json({
    coaches,
    ratePerSession: COACH_SESSION_RATE_EUR,
  });
}
