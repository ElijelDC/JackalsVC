"use client";

import { useMemo, useState } from "react";
import {
  CoachUpcomingMatchesCard,
  CoachUpcomingTrainingCard,
} from "@/components/dashboard/DashboardUpcomingScheduleSections";
import { DashboardUpcomingClubEventsPanel } from "@/components/dashboard/MemberDashboardPanels";
import { DashboardVodPlaylistsPanel } from "@/components/dashboard/DashboardVodPlaylistsPanel";
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
import type { CoachScheduleItem, DashboardClubEvent } from "@/components/dashboard/dashboard-types";
import type { CoachUnansweredItem } from "@/lib/coach-unanswered-config";
import type { TeamVodPlaylists } from "@/lib/vod-playlists";
import { AnimatedPageSections } from "@/components/motion/AnimatedPageSections";

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
  vodPlaylistsByTeam,
}: {
  teams: CoachTeamOption[];
  teamName: string;
  currentPayment: CoachPaymentItem | null;
  ratePerSession: number;
  showPayments: boolean;
  pendingResponses: CoachUnansweredItem[];
  upcomingTraining: CoachScheduleItem[];
  upcomingMatches: CoachScheduleItem[];
  upcomingClubEvents: DashboardClubEvent[];
  vodPlaylistsByTeam: TeamVodPlaylists[];
}) {
  const [teamFilter, setTeamFilter] = useState("");
  const multiTeam = teams.length > 1;

  const filteredPending = filterCoachItemsByTeam(pendingResponses, teamFilter);
  const filteredTraining = filterCoachItemsByTeam(upcomingTraining, teamFilter);
  const filteredMatches = filterCoachItemsByTeam(upcomingMatches, teamFilter);

  const activeVodPlaylists = useMemo(() => {
    if (teamFilter) {
      return (
        vodPlaylistsByTeam.find((row) => row.trainingTeamKey === teamFilter) ??
        null
      );
    }
    return vodPlaylistsByTeam[0] ?? null;
  }, [teamFilter, vodPlaylistsByTeam]);

  return (
    <AnimatedPageSections className="space-y-6 sm:space-y-8">
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

      <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-5 lg:gap-8 [&>*]:min-w-0">
        <CoachUpcomingTrainingCard
          sessions={filteredTraining}
          selectedTeamKey={teamFilter}
          multiTeam={multiTeam}
        />
        <CoachUpcomingMatchesCard
          matches={filteredMatches}
          selectedTeamKey={teamFilter}
          multiTeam={multiTeam}
        />
      </div>

      <CoachDashboardQuickActions />

      <div className="grid min-w-0 grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-8 [&>*]:min-w-0">
        <div className="flex h-full min-w-0 lg:col-span-2">
          <DashboardUpcomingClubEventsPanel upcomingEvents={upcomingClubEvents} />
        </div>
        <DashboardVodPlaylistsPanel playlists={activeVodPlaylists} />
      </div>
    </AnimatedPageSections>
  );
}
