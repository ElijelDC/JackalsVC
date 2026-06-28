import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CoachDashboard } from "@/components/dashboard/CoachDashboard";
import { DashboardWelcomeSection } from "@/components/dashboard/DashboardWelcomeSection";
import {
  DashboardUpcomingClubEventsPanel,
  DashboardUpcomingMatchesCard,
  DashboardUpcomingTrainingCard,
  MemberPaymentsPanel,
} from "@/components/dashboard/MemberDashboardPanels";
import { PageContainer } from "@/components/layout/PageShell";
import { AnimatedPageSections } from "@/components/motion/AnimatedPageSections";
import { getCoachProfile } from "@/lib/coach-auth";
import { getCoachUnansweredItemsWithReminders } from "@/lib/coach-unanswered";
import {
  getCoachSalaryPaymentsWithCache,
  preloadTeamEvents,
} from "@/lib/coach-payments";
import { COACH_SESSION_RATE_EUR, isCurrentPaymentMonth, maskCoachPaymentForCoachView } from "@/lib/coach-payments-config";
import {
  enrichEventRecords,
  serializeEnrichedEvent,
} from "@/lib/event-enrichment";
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

  if (coach) {
    const now = new Date();
    const eventsThrough = new Date(now);
    eventsThrough.setDate(eventsThrough.getDate() + DASHBOARD_WEEKS * 7);

    const [
      pendingResponses,
      matchEventsRaw,
      upcomingTraining,
      upcomingMatches,
    ] = await Promise.all([
      getCoachUnansweredItemsWithReminders(
        coach.trainingTeamKey,
        coach.userId,
      ),
      prisma.event.findMany({
        where: {
          startDate: { gte: now, lte: eventsThrough },
          type: { in: ["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL"] },
        },
        orderBy: { startDate: "asc" },
      }),
      getUpcomingTeamTrainingEvents(
        session.user.id,
        coach.trainingTeamKey,
        now,
        TRAINING_RESPONSE_OPENS_DAYS,
      ),
      getUpcomingTeamMatches(
        session.user.id,
        coach.trainingTeamKey,
        now,
        TRAINING_RESPONSE_OPENS_DAYS,
      ),
    ]);

    const paymentOpts = { monthsBack: 3, monthsAhead: 1 };
    const eventCache = await preloadTeamEvents([coach.trainingTeamKey], paymentOpts.monthsBack, paymentOpts.monthsAhead);
    const payments = coach.isPaidCoach
      ? await getCoachSalaryPaymentsWithCache(
          coach.clubMemberId,
          coach.trainingTeamKey,
          coach.userId,
          paymentOpts,
          eventCache,
        )
      : [];

    const enrichedMatches = await enrichEventRecords(matchEventsRaw);
    const upcomingClubEvents = enrichedMatches.map(serializeEnrichedEvent);
    const firstName = session.user.name?.split(" ")[0] ?? "Coach";
    const currentPayment =
      payments.find((payment) =>
        isCurrentPaymentMonth(payment.year, payment.month, now),
      ) ?? null;

    return (
      <PageContainer className="py-8 sm:py-12">
        <DashboardWelcomeSection
          title={`Welcome, ${firstName}`}
          description={
            coach.isPaidCoach
              ? `${coach.teamName} · Your squad schedule and club payments`
              : `${coach.teamName} · Your squad schedule and club events`
          }
        />
        <CoachDashboard
          teamName={coach.teamName}
          ratePerSession={COACH_SESSION_RATE_EUR}
          showPayments={coach.isPaidCoach}
          currentPayment={
            currentPayment ? maskCoachPaymentForCoachView(currentPayment) : null
          }
          pendingResponses={pendingResponses}
          upcomingTraining={upcomingTraining}
          upcomingMatches={upcomingMatches}
          upcomingClubEvents={upcomingClubEvents.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            type: e.type,
            location: e.location,
            coach: e.coach,
            trainingSessionId: e.trainingSessionId,
          }))}
        />
      </PageContainer>
    );
  }

  const now = new Date();
  const eventsThrough = new Date(now);
  eventsThrough.setDate(eventsThrough.getDate() + DASHBOARD_WEEKS * 7);

  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);
  const team = await getTrainingTeamByKey(trainingTeamKey);

  const [memberships, matchEventsRaw, upcomingTraining, upcomingMatches] =
    await Promise.all([
      prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.event.findMany({
        where: {
          startDate: { gte: now, lte: eventsThrough },
          type: { in: ["TOURNAMENT", "SKILLS_CLINIC", "SOCIAL"] },
        },
        orderBy: { startDate: "asc" },
      }),
      trainingTeamKey
        ? getUpcomingTeamTrainingEvents(
            session.user.id,
            trainingTeamKey,
            now,
            TRAINING_RESPONSE_OPENS_DAYS,
          )
        : Promise.resolve([]),
      trainingTeamKey
        ? getUpcomingTeamMatches(
            session.user.id,
            trainingTeamKey,
            now,
            TRAINING_RESPONSE_OPENS_DAYS,
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

  const enrichedMatches = await enrichEventRecords(matchEventsRaw);
  const upcomingClubEvents = enrichedMatches.map(serializeEnrichedEvent);

  return (
    <PageContainer className="py-8 sm:py-12">
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

        <div className="grid gap-8 lg:grid-cols-2">
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

        <DashboardUpcomingClubEventsPanel
          upcomingEvents={upcomingClubEvents.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startDate: e.startDate,
            endDate: e.endDate,
            type: e.type,
            location: e.location,
            coach: e.coach,
            trainingSessionId: e.trainingSessionId,
          }))}
        />
      </AnimatedPageSections>
    </PageContainer>
  );
}
