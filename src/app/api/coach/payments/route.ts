import { NextResponse } from "next/server";
import { requirePaidCoach } from "@/lib/coach-auth";
import { getCoachSalaryPaymentsWithCache, preloadTeamEvents } from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, maskCoachPaymentsForCoachView } from "@/lib/coach-payments-config";

export async function GET() {
  const { coach, response } = await requirePaidCoach();
  if (response) return response;

  const eventCache = await preloadTeamEvents([coach!.trainingTeamKey], 12, 3);
  const payments = await getCoachSalaryPaymentsWithCache(
    coach!.clubMemberId,
    coach!.trainingTeamKey,
    coach!.userId,
    { monthsBack: 12, monthsAhead: 3 },
    eventCache,
  );

  return NextResponse.json({
    payments: maskCoachPaymentsForCoachView(payments),
    ratePerSession: COACH_SESSION_RATE_EUR,
    teamName: coach!.teamName,
  });
}
