import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  DashboardUpcomingClubEventsPanel,
  DashboardUpcomingMatchesCard,
  DashboardUpcomingTrainingCard,
  MemberPaymentsPanel,
} from "@/components/dashboard/MemberDashboardPanels";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimatedPageSections } from "@/components/motion/AnimatedPageSections";
import {
  enrichEventRecords,
  serializeEnrichedEvent,
} from "@/lib/event-enrichment";
import { getUpcomingTeamMatches } from "@/lib/matches";
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

  const now = new Date();
  const eventsThrough = new Date(now);
  eventsThrough.setDate(eventsThrough.getDate() + DASHBOARD_WEEKS * 7);

  const trainingTeamKey = await getUserTrainingTeamKey(session.user.id);
  const team = getTrainingTeamByKey(trainingTeamKey);

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
          type: { in: ["TOURNAMENT", "SOCIAL"] },
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

  const enrichedMatches = await enrichEventRecords(matchEventsRaw);
  const upcomingClubEvents = enrichedMatches.map(serializeEnrichedEvent);

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Member"}`}
        description="Your membership, training, and matches at a glance"
      />

      <AnimatedPageSections>
        <MemberPaymentsPanel
          memberships={memberships.map((m) => ({
            id: m.id,
            status: m.status,
            paymentSchedule: m.paymentSchedule as "MONTHLY" | "INSTALLMENTS" | "FULL",
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
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <DashboardUpcomingTrainingCard teamName={team?.name ?? null} sessions={upcomingTraining} />
          <DashboardUpcomingMatchesCard teamName={team?.name ?? null} matches={upcomingMatches} />
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
