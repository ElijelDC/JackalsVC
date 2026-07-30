import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CoachDashboardBody } from "@/components/dashboard/CoachDashboardBody";
import { DashboardWelcomeSection } from "@/components/dashboard/DashboardWelcomeSection";
import {
  DashboardUpcomingClubEventsPanel,
  DashboardUpcomingMatchesCard,
  DashboardUpcomingTrainingCard,
  MemberPaymentsPanel,
} from "@/components/dashboard/MemberDashboardPanels";
import { DASHBOARD_SCHEDULE_FETCH_LIMIT } from "@/lib/dashboard-schedule-config";
import { PageContainer } from "@/components/layout/PageShell";
import { AnimatedPageSections } from "@/components/motion/AnimatedPageSections";
import { getCoachProfile } from "@/lib/coach-auth";
import { getCoachUnansweredItemsWithReminders } from "@/lib/coach-unanswered";
import {
  getCoachSalaryPaymentsWithCache,
  preloadTeamEvents,
} from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, isCurrentPaymentMonth, maskCoachPaymentForCoachView } from "@/lib/coach-payments-config";
import { getDashboardClubEvents } from "@/lib/dashboard-club-events";
import { getUpcomingTeamMatches } from "@/lib/matches";
import { assessMembershipPaymentAccess } from "@/lib/membership-overdue";
import { getAttendanceAccessInfo } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { TRAINING_RESPONSE_OPENS_DAYS } from "@/lib/training-attendance-config";
import { getUpcomingTeamTrainingEvents } from "@/lib/training-attendance";
import {
  getTrainingTeamByKey,
  getUserTrainingTeamKey,
} from "@/lib/training-teams";

export const metadata = {
  title: "Dashboard",
};

const DASHBOARD_WEEKS = 4;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const coach = await getCoachProfile(session.user.id);
  const now = new Date();

  if (coach) {
    const [
      pendingResponses,
      upcomingClubEvents,
      upcomingTraining,
      upcomingMatches,
    ] = await Promise.all([
      getCoachUnansweredItemsWithReminders(
        coach.trainingTeamKeys,
        coach.userId,
      ),
      getDashboardClubEvents(now, DASHBOARD_WEEKS),
      getUpcomingTeamTrainingEvents(
        session.user.id,
        coach.trainingTeamKeys,
        now,
        TRAINING_RESPONSE_OPENS_DAYS,
        DASHBOARD_SCHEDULE_FETCH_LIMIT,
      ),
      getUpcomingTeamMatches(
        session.user.id,
        coach.trainingTeamKeys,
        now,
        TRAINING_RESPONSE_OPENS_DAYS,
        DASHBOARD_SCHEDULE_FETCH_LIMIT,
      ),
    ]);

    const paymentOpts = { monthsBack: 3, monthsAhead: 1 };
    const eventCache = await preloadTeamEvents(
      coach.trainingTeamKeys,
      paymentOpts.monthsBack,
      paymentOpts.monthsAhead,
    );
    const payments = coach.isPaidCoach
      ? await getCoachSalaryPaymentsWithCache(
          coach.clubMemberId,
          coach.trainingTeamKeys,
          coach.userId,
          paymentOpts,
          eventCache,
        )
      : [];

    const teamLabel =
      coach.teams.length > 1
        ? `${coach.teams.length} squads`
        : coach.teamName;
    const scheduleHint = coach.isPaidCoach
      ? "Your schedule and club payments"
      : "Your schedule and club events";
    const firstName = session.user.name?.split(" ")[0] ?? "Coach";
    const currentPayment =
      payments.find((payment) =>
        isCurrentPaymentMonth(payment.year, payment.month, now),
      ) ?? null;

    return (
      <PageContainer className="overflow-x-hidden py-8 sm:py-12">
        <DashboardWelcomeSection
          title={`Welcome, ${firstName}`}
          description={`${teamLabel} · ${scheduleHint}`}
        />
        <CoachDashboardBody
          teams={coach.teams}
          teamName={teamLabel}
          ratePerSession={COACH_SESSION_RATE_EUR}
          showPayments={coach.isPaidCoach}
          currentPayment={
            currentPayment ? maskCoachPaymentForCoachView(currentPayment) : null
          }
          pendingResponses={pendingResponses}
          upcomingTraining={upcomingTraining}
          upcomingMatches={upcomingMatches}
          upcomingClubEvents={upcomingClubEvents}
        />
      </PageContainer>
    );
  }

  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);
  const team = await getTrainingTeamByKey(trainingTeamKey);

  const [memberships, upcomingClubEvents, upcomingTraining, upcomingMatches] =
    await Promise.all([
      prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      getDashboardClubEvents(now, DASHBOARD_WEEKS),
      trainingTeamKey
        ? getUpcomingTeamTrainingEvents(
            session.user.id,
            trainingTeamKey,
            now,
            TRAINING_RESPONSE_OPENS_DAYS,
            DASHBOARD_SCHEDULE_FETCH_LIMIT,
          )
        : Promise.resolve([]),
      trainingTeamKey
        ? getUpcomingTeamMatches(
            session.user.id,
            trainingTeamKey,
            now,
            TRAINING_RESPONSE_OPENS_DAYS,
            DASHBOARD_SCHEDULE_FETCH_LIMIT,
          )
        : Promise.resolve([]),
    ]);

  const currentMembership = memberships.find((m) => new Date(m.endDate) > new Date());
  const payments = currentMembership
    ? await prisma.payment.findMany({
        where: { membershipId: currentMembership.id },
        orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const paymentAccess = currentMembership
    ? assessMembershipPaymentAccess({
        membershipStatus: currentMembership.status,
        paymentSchedule: currentMembership.paymentSchedule,
        paymentOverdueOverride: currentMembership.paymentOverdueOverride,
        paymentOverdueOverrideUntil: currentMembership.paymentOverdueOverrideUntil,
        payments,
      })
    : null;

  const attendanceAccess = await getAttendanceAccessInfo(session.user);

  return (
    <PageContainer className="overflow-x-hidden py-8 sm:py-12">
      <DashboardWelcomeSection
        title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Member"}`}
        description="Your membership, training, and matches at a glance"
      />

      <AnimatedPageSections>
        <MemberPaymentsPanel
          memberships={memberships.map((m) => ({
            id: m.id,
            status: m.status,
            paymentSchedule: m.paymentSchedule as "MONTHLY" | "INSTALLMENTS" | "FULL",
            paymentOverdueOverride: m.paymentOverdueOverride,
            startDate: m.startDate.toISOString(),
            endDate: m.endDate.toISOString(),
            plan: { name: m.plan.name, price: m.plan.price },
          }))}
          payments={payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            installmentNumber: p.installmentNumber,
            dueDate: p.dueDate?.toISOString() ?? null,
          }))}
          paymentAccess={paymentAccess}
        />

        <div className="grid min-w-0 gap-8 lg:grid-cols-2 [&>*]:min-w-0">
          <DashboardUpcomingTrainingCard
            teamName={team?.name ?? null}
            sessions={upcomingTraining}
            attendanceBlocked={!attendanceAccess.canAccess}
            attendanceBlockReason={attendanceAccess.blockReason}
          />
          <DashboardUpcomingMatchesCard
            teamName={team?.name ?? null}
            matches={upcomingMatches}
            attendanceBlocked={!attendanceAccess.canAccess}
            attendanceBlockReason={attendanceAccess.blockReason}
          />
        </div>

        <DashboardUpcomingClubEventsPanel upcomingEvents={upcomingClubEvents} />
      </AnimatedPageSections>
    </PageContainer>
  );
}
