"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Swords } from "lucide-react";
import type { ReactNode } from "react";
import type {
  CoachScheduleItem,
  DashboardScheduleItem,
} from "@/components/dashboard/dashboard-types";
import {
  buildDashboardScheduleSummary,
  countNeedsResponse,
  DashboardUpcomingScheduleCard,
} from "@/components/dashboard/DashboardUpcomingScheduleCard";
import type { AttendanceBlockReason } from "@/lib/membership";
import { buildScheduleListHref, withDashboardReturn } from "@/lib/dashboard-return";

type ScheduleKind = "training" | "matches";

const SCHEDULE_CONFIG: Record<
  ScheduleKind,
  {
    icon: LucideIcon;
    heading: string;
    viewAllBase: string;
    viewAllLabel: string;
    noun: { one: string; many: string };
    buildItemHref: (item: DashboardScheduleItem) => string;
  }
> = {
  training: {
    icon: CalendarDays,
    heading: "Upcoming training",
    viewAllBase: "/training",
    viewAllLabel: "All training",
    noun: { one: "session", many: "sessions" },
    buildItemHref: (item) => `/training/session/${item.id}`,
  },
  matches: {
    icon: Swords,
    heading: "Upcoming matches",
    viewAllBase: "/matches",
    viewAllLabel: "All matches",
    noun: { one: "match", many: "matches" },
    buildItemHref: (item) => `/matches/${item.id}`,
  },
};

function OverdueAttendanceBanner({ kind }: { kind: ScheduleKind }) {
  return (
    <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {kind === "training" ? "Training" : "Match"} responses are paused until your overdue
      membership payment is cleared.{" "}
      <Link
        href={withDashboardReturn("/membership")}
        className="font-medium text-white underline-offset-2 hover:underline"
      >
        View payment schedule
      </Link>
    </div>
  );
}

function MemberUpcomingScheduleCard({
  kind,
  teamName,
  items,
  attendanceBlocked = false,
  attendanceBlockReason = null,
}: {
  kind: ScheduleKind;
  teamName: string | null;
  items: DashboardScheduleItem[];
  attendanceBlocked?: boolean;
  attendanceBlockReason?: AttendanceBlockReason | null;
}) {
  const config = SCHEDULE_CONFIG[kind];
  const needsResponse = countNeedsResponse(items);
  const unavailable =
    kind === "training"
      ? {
          summary: teamName ? null : "No training team assigned",
          message: teamName ? null : "Ask an admin to assign you to a training team.",
        }
      : {
          summary: teamName ? null : "No team assigned",
          message: teamName ? null : "Ask an admin to assign you to a team.",
        };

  return (
    <DashboardUpcomingScheduleCard
      icon={config.icon}
      heading={config.heading}
      summary={buildDashboardScheduleSummary(items, needsResponse, config.noun, {
        unavailableLabel: unavailable.summary,
      })}
      items={items}
      unavailableMessage={unavailable.message}
      topBanner={
        attendanceBlocked && attendanceBlockReason === "overdue" ? (
          <OverdueAttendanceBanner kind={kind} />
        ) : null
      }
      buildHref={config.buildItemHref}
      viewAllHref={config.viewAllBase}
      viewAllLabel={config.viewAllLabel}
    />
  );
}

function CoachUpcomingScheduleCard({
  kind,
  items,
  selectedTeamKey = "",
  multiTeam = false,
}: {
  kind: ScheduleKind;
  items: CoachScheduleItem[];
  selectedTeamKey?: string;
  multiTeam?: boolean;
}) {
  const config = SCHEDULE_CONFIG[kind];
  const needsResponse = countNeedsResponse(items);
  const showTeamInMeta = multiTeam && !selectedTeamKey;

  return (
    <DashboardUpcomingScheduleCard
      icon={config.icon}
      heading={config.heading}
      summary={buildDashboardScheduleSummary(items, needsResponse, config.noun, {
        showSquadCount: showTeamInMeta,
      })}
      items={items}
      showTeamInMeta={showTeamInMeta}
      buildHref={config.buildItemHref}
      viewAllHref={buildScheduleListHref(config.viewAllBase, {
        team: selectedTeamKey || undefined,
      })}
      viewAllLabel={config.viewAllLabel}
    />
  );
}

export function DashboardUpcomingTrainingCard({
  sessions,
  ...props
}: Omit<Parameters<typeof MemberUpcomingScheduleCard>[0], "kind" | "items"> & {
  sessions: DashboardScheduleItem[];
}) {
  return <MemberUpcomingScheduleCard kind="training" items={sessions} {...props} />;
}

export function DashboardUpcomingMatchesCard({
  matches,
  ...props
}: Omit<Parameters<typeof MemberUpcomingScheduleCard>[0], "kind" | "items"> & {
  matches: DashboardScheduleItem[];
}) {
  return <MemberUpcomingScheduleCard kind="matches" items={matches} {...props} />;
}

export function CoachUpcomingTrainingCard({
  sessions,
  ...props
}: Omit<Parameters<typeof CoachUpcomingScheduleCard>[0], "kind" | "items"> & {
  sessions: CoachScheduleItem[];
}) {
  return <CoachUpcomingScheduleCard kind="training" items={sessions} {...props} />;
}

export function CoachUpcomingMatchesCard({
  matches,
  ...props
}: Omit<Parameters<typeof CoachUpcomingScheduleCard>[0], "kind" | "items"> & {
  matches: CoachScheduleItem[];
}) {
  return <CoachUpcomingScheduleCard kind="matches" items={matches} {...props} />;
}

export type { CoachScheduleItem, DashboardScheduleItem };
