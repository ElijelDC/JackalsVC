import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CoachDashboardBody } from "@/components/dashboard/CoachDashboardBody";
import { DashboardWelcomeSection } from "@/components/dashboard/DashboardWelcomeSection";
import { InstallHomeScreenPrompt } from "@/components/dashboard/InstallHomeScreenPrompt";
import { PushNotificationsPrompt } from "@/components/pwa/PushNotificationsPrompt";
import { DashboardSeasonFixturesPanel } from "@/components/dashboard/DashboardSeasonFixturesPanel";
import { DashboardVodPlaylistsPanel } from "@/components/dashboard/DashboardVodPlaylistsPanel";
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
import { getUpcomingFixturesPreview, getUpcomingTeamMatches } from "@/lib/matches";
import { assessMembershipPaymentAccess } from "@/lib/membership-overdue";
import {
  getAttendanceAccessInfo,
  syncMembershipArrearsStatus,
} from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { getSiteContentMap } from "@/lib/site-content";
import { TRAINING_RESPONSE_OPENS_DAYS } from "@/lib/training-attendance-config";
import { getUpcomingTeamTrainingEvents } from "@/lib/training-attendance";
import {
  getTrainingSquads,
  getTrainingTeamByKey,
  getUserTrainingTeamKey,
} from "@/lib/training-teams";
import {
  readAllTeamVodPlaylists,
  readTeamVodPlaylists,
} from "@/lib/vod-playlists";

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
      siteContent,
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
      getSiteContentMap(),
    ]);

    const vodPlaylistsByTeam = readAllTeamVodPlaylists(
      siteContent,
      coach.teams.map((team) => ({ key: team.key, name: team.name })),
    );

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
      <PageContainer className="overflow-x-hidden py-6 sm:py-12">
        <DashboardWelcomeSection
          title={`Welcome, ${firstName}`}
          description={`${teamLabel} · ${scheduleHint}`}
        />
        <InstallHomeScreenPrompt />
        <PushNotificationsPrompt />
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
          vodPlaylistsByTeam={vodPlaylistsByTeam}
        />
      </PageContainer>
    );
  }

  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);
  const team = await getTrainingTeamByKey(trainingTeamKey);
  const squads = await getTrainingSquads();

  const [memberships, upcomingClubEvents, upcomingTraining, upcomingMatches, fixturePreviewRows, siteContent] =
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
      getUpcomingFixturesPreview(
        squads.map((squad) => squad.key),
        { fromDate: now, limit: 4, preferTeamKey: trainingTeamKey },
      ),
      getSiteContentMap(),
    ]);

  const vodPlaylists =
    trainingTeamKey && team
      ? readTeamVodPlaylists(siteContent, trainingTeamKey, team.name)
      : null;

  const teamNameByKey = new Map(squads.map((squad) => [squad.key, squad.name]));
  const fixturePreview = fixturePreviewRows.map((match) => ({
    id: match.id,
    opponentName: match.opponentName,
    venue: match.venue,
    location: match.location,
    matchStart: match.matchStart.toISOString(),
    trainingTeamKey: match.trainingTeamKey,
    teamName: teamNameByKey.get(match.trainingTeamKey) ?? match.trainingTeamKey,
    isMemberTeam: Boolean(
      trainingTeamKey && match.trainingTeamKey === trainingTeamKey,
    ),
  }));

  const currentMembership = memberships.find((m) => new Date(m.endDate) > new Date());
  const payments = currentMembership
    ? await prisma.payment.findMany({
        where: { membershipId: currentMembership.id },
        orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
      })
    : [];

  const membershipStatus = currentMembership
    ? await syncMembershipArrearsStatus({
        id: currentMembership.id,
        status: currentMembership.status,
        paymentSchedule: currentMembership.paymentSchedule,
        payments,
      })
    : null;

  const paymentAccess = currentMembership
    ? assessMembershipPaymentAccess({
        membershipStatus: membershipStatus ?? currentMembership.status,
        paymentSchedule: currentMembership.paymentSchedule,
        paymentOverdueOverride: currentMembership.paymentOverdueOverride,
        paymentOverdueOverrideUntil: currentMembership.paymentOverdueOverrideUntil,
        payments,
      })
    : null;

  const attendanceAccess = await getAttendanceAccessInfo(session.user);
  const isPaygPlayer = Boolean(session.user.isPaygPlayer);

  return (
    <PageContainer className="overflow-x-hidden py-6 sm:py-12">
      <DashboardWelcomeSection
        title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Member"}`}
        description={
          isPaygPlayer
            ? "Your training and matches at a glance"
            : "Your membership, training, and matches at a glance"
        }
      />
      <InstallHomeScreenPrompt />
      <PushNotificationsPrompt />

      <AnimatedPageSections className="space-y-6 sm:space-y-8">
        {!isPaygPlayer && (
          <MemberPaymentsPanel
            memberships={memberships.map((m) => ({
              id: m.id,
              status:
                currentMembership?.id === m.id && membershipStatus
                  ? membershipStatus
                  : m.status,
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
        )}

        <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-5 lg:gap-8 [&>*]:min-w-0">
          <DashboardUpcomingTrainingCard
            teamName={team?.name ?? null}
            sessions={upcomingTraining}
            attendanceBlocked={!attendanceAccess.canAccessTraining}
            attendanceBlockReason={attendanceAccess.blockReasonTraining}
          />
          <DashboardUpcomingMatchesCard
            teamName={team?.name ?? null}
            matches={upcomingMatches}
            attendanceBlocked={!attendanceAccess.canAccessMatches}
            attendanceBlockReason={attendanceAccess.blockReasonMatches}
          />
        </div>

        <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-8 [&>*]:min-w-0">
          <div className="flex h-full min-w-0 lg:col-span-2">
            <DashboardUpcomingClubEventsPanel upcomingEvents={upcomingClubEvents} />
          </div>
          <DashboardVodPlaylistsPanel playlists={vodPlaylists} />
        </div>

        <DashboardSeasonFixturesPanel
          fixtures={fixturePreview}
          memberTeamKey={trainingTeamKey}
        />
      </AnimatedPageSections>
    </PageContainer>
  );
}
