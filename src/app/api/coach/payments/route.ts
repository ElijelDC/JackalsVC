import { NextResponse } from "next/server";
import { requirePaidCoach } from "@/lib/coach-auth";
import { getCoachSalaryPayments } from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, maskCoachPaymentsForCoachView } from "@/lib/coach-payments-config";

export async function GET() {
  const { coach, response } = await requirePaidCoach();
  if (response) return response;

  const payments = await getCoachSalaryPayments(
    coach!.clubMemberId,
    coach!.trainingTeamKey,
    coach!.userId,
  );

  return NextResponse.json({
    payments: maskCoachPaymentsForCoachView(payments),
    ratePerSession: COACH_SESSION_RATE_EUR,
    teamName: coach!.teamName,
  });
}
