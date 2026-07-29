import { CoachPaymentsOverview } from "@/components/coach/CoachPaymentsOverview";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { requirePaidCoachPage } from "@/lib/coach-auth";
import { getCoachSalaryPaymentsWithCache, preloadTeamEvents } from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, maskCoachPaymentsForCoachView } from "@/lib/coach-payments-config";

export const metadata = {
  title: "Payments",
};

export default async function CoachPaymentsPage() {
  const { coach } = await requirePaidCoachPage("/payments");
  const opts = { monthsBack: 12, monthsAhead: 3 };
  const teamKeys = coach.trainingTeamKeys;
  const teamLabel =
    coach.teams.length > 1
      ? coach.teams.map((team) => team.name).join(" · ")
      : coach.teamName;
  const eventCache = await preloadTeamEvents(
    teamKeys,
    opts.monthsBack,
    opts.monthsAhead,
  );
  const payments = await getCoachSalaryPaymentsWithCache(
    coach.clubMemberId,
    teamKeys,
    coach.userId,
    opts,
    eventCache,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description={`€${COACH_SESSION_RATE_EUR} per payable training across ${teamLabel}. Payments are made on the last Friday of each month. Can't attend sessions are deducted automatically.`}
      />
      <CoachPaymentsOverview
        teamName={teamLabel}
        ratePerSession={COACH_SESSION_RATE_EUR}
        payments={maskCoachPaymentsForCoachView(payments)}
      />
    </PageContainer>
  );
}
