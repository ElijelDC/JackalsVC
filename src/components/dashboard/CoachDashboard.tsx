import {
  DashboardUpcomingClubEventsPanel,
  DashboardUpcomingMatchesCard,
  DashboardUpcomingTrainingCard,
} from "@/components/dashboard/MemberDashboardPanels";
import {
  CoachDashboardPaymentsPanel,
  CoachDashboardQuickActions,
} from "@/components/dashboard/CoachDashboardPanels";
import { CoachTrainingResponsesPanel } from "@/components/coach/CoachTrainingResponsesPanel";
import type { CoachPaymentItem } from "@/components/coach/CoachPaymentsOverview";
import type { CoachUnansweredItem } from "@/lib/coach-unanswered-config";
import { AnimatedPageSections } from "@/components/motion/AnimatedPageSections";
import type { TrainingAttendanceStatus } from "@/lib/training-attendance-config";

type DashboardEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
  coach?: string | null;
  trainingSessionId?: string | null;
};

type UpcomingItem = {
  id: string;
  title: string;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

export function CoachDashboard({
  teamName,
  currentPayment,
  ratePerSession,
  showPayments,
  pendingResponses,
  upcomingTraining,
  upcomingMatches,
  upcomingClubEvents,
}: {
  teamName: string;
  currentPayment: CoachPaymentItem | null;
  ratePerSession: number;
  showPayments: boolean;
  pendingResponses: CoachUnansweredItem[];
  upcomingTraining: UpcomingItem[];
  upcomingMatches: UpcomingItem[];
  upcomingClubEvents: DashboardEvent[];
}) {
  return (
    <AnimatedPageSections>
      {showPayments && (
        <CoachDashboardPaymentsPanel
          teamName={teamName}
          ratePerSession={ratePerSession}
          currentPayment={currentPayment}
        />
      )}

      <CoachDashboardQuickActions />

      <CoachTrainingResponsesPanel pending={pendingResponses} />

      <div className="grid min-w-0 gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <DashboardUpcomingTrainingCard
          teamName={teamName}
          sessions={upcomingTraining}
        />
        <DashboardUpcomingMatchesCard
          teamName={teamName}
          matches={upcomingMatches}
        />
      </div>

      <DashboardUpcomingClubEventsPanel upcomingEvents={upcomingClubEvents} />
    </AnimatedPageSections>
  );
}
