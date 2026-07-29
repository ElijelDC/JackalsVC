import { CoachDashboardBody } from "@/components/dashboard/CoachDashboardBody";
import type { CoachPaymentItem } from "@/components/coach/CoachPaymentsOverview";
import type { CoachUnansweredItem } from "@/lib/coach-unanswered-config";
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
  teamName?: string | null;
  teamKey?: string | null;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

type CoachTeam = {
  key: string;
  name: string;
};

export function CoachDashboard({
  teams,
  teamName,
  currentPayment,
  ratePerSession,
  showPayments,
  pendingResponses,
  upcomingTraining,
  upcomingMatches,
  upcomingClubEvents,
}: {
  teams: CoachTeam[];
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
    <CoachDashboardBody
      teams={teams}
      teamName={teamName}
      ratePerSession={ratePerSession}
      showPayments={showPayments}
      currentPayment={currentPayment}
      pendingResponses={pendingResponses}
      upcomingTraining={upcomingTraining}
      upcomingMatches={upcomingMatches}
      upcomingClubEvents={upcomingClubEvents}
    />
  );
}
