"use client";

import { useState } from "react";
import {
  CoachUpcomingMatchesCard,
  CoachUpcomingTrainingCard,
} from "@/components/dashboard/CoachDashboardSchedule";
import { DashboardUpcomingClubEventsPanel } from "@/components/dashboard/MemberDashboardPanels";
import {
  CoachDashboardPaymentsPanel,
  CoachDashboardQuickActions,
} from "@/components/dashboard/CoachDashboardPanels";
import { CoachTrainingResponsesPanel } from "@/components/coach/CoachTrainingResponsesPanel";
import {
  CoachTeamFilter,
  filterCoachItemsByTeam,
  type CoachTeamOption,
} from "@/components/dashboard/CoachTeamFilter";
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
  teamName?: string | null;
  teamKey?: string | null;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

export function CoachDashboardBody({
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
  teams: CoachTeamOption[];
  teamName: string;
  currentPayment: CoachPaymentItem | null;
  ratePerSession: number;
  showPayments: boolean;
  pendingResponses: CoachUnansweredItem[];
  upcomingTraining: UpcomingItem[];
  upcomingMatches: UpcomingItem[];
  upcomingClubEvents: DashboardEvent[];
}) {
  const [teamFilter, setTeamFilter] = useState("");
  const multiTeam = teams.length > 1;

  const filteredPending = filterCoachItemsByTeam(pendingResponses, teamFilter);
  const filteredTraining = filterCoachItemsByTeam(upcomingTraining, teamFilter);
  const filteredMatches = filterCoachItemsByTeam(upcomingMatches, teamFilter);

  return (
    <AnimatedPageSections>
      {showPayments && (
        <CoachDashboardPaymentsPanel
          teamName={teamName}
          ratePerSession={ratePerSession}
          currentPayment={currentPayment}
        />
      )}

      {multiTeam ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            Filter responses, training, and matches
          </p>
          <CoachTeamFilter
            teams={teams}
            value={teamFilter}
            onChange={setTeamFilter}
          />
        </div>
      ) : null}

      <CoachTrainingResponsesPanel
        pending={filteredPending}
        showTeam={multiTeam && !teamFilter}
      />

      <div className="grid min-w-0 gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <CoachUpcomingTrainingCard
          sessions={filteredTraining}
          selectedTeamKey={teamFilter}
          multiTeam={multiTeam}
          emptyMessage={
            teamFilter
              ? "Nothing scheduled for this squad in the next 2 weeks."
              : "No training sessions in the next 2 weeks."
          }
        />
        <CoachUpcomingMatchesCard
          matches={filteredMatches}
          selectedTeamKey={teamFilter}
          multiTeam={multiTeam}
          emptyMessage={
            teamFilter
              ? "No matches for this squad in the next 2 weeks."
              : "No matches in the next 2 weeks."
          }
        />
      </div>

      <CoachDashboardQuickActions />

      <DashboardUpcomingClubEventsPanel upcomingEvents={upcomingClubEvents} />
    </AnimatedPageSections>
  );
}
