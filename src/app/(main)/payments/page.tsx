import { CoachPaymentsOverview } from "@/components/coach/CoachPaymentsOverview";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { requirePaidCoachPage } from "@/lib/coach-auth";
import { getCoachSalaryPayments } from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, maskCoachPaymentsForCoachView } from "@/lib/coach-payments-config";

export const metadata = {
  title: "Payments",
};

export default async function CoachPaymentsPage() {
  const { coach } = await requirePaidCoachPage("/payments");
  const payments = await getCoachSalaryPayments(
    coach.clubMemberId,
    coach.trainingTeamKey,
    coach.userId,
    { monthsBack: 12, monthsAhead: 10 },
  );

  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description={`€${COACH_SESSION_RATE_EUR} per payable training for ${coach.teamName}. Payments are made on the last Friday of each month. Can't attend sessions are deducted automatically.`}
      />
      <CoachPaymentsOverview
        teamName={coach.teamName}
        ratePerSession={COACH_SESSION_RATE_EUR}
        payments={maskCoachPaymentsForCoachView(payments)}
      />
    </PageContainer>
  );
}
