"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { DashboardScheduleItem } from "@/components/dashboard/dashboard-types";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import {
  buildScheduleMeta,
  DashboardScheduleRow,
} from "@/components/dashboard/DashboardScheduleRow";
import { itemNeedsUrgentResponse } from "@/lib/training-attendance-config";
import { withDashboardReturn } from "@/lib/dashboard-return";

import { DASHBOARD_SCHEDULE_PREVIEW_LIMIT } from "@/lib/dashboard-schedule-config";

function squadCount(items: DashboardScheduleItem[]) {
  return new Set(items.map((item) => item.teamName).filter(Boolean)).size;
}

export function buildDashboardScheduleSummary(
  items: DashboardScheduleItem[],
  needsResponse: number,
  noun: { one: string; many: string },
  options?: {
    showSquadCount?: boolean;
    unavailableLabel?: string | null;
  },
) {
  if (options?.unavailableLabel) {
    return options.unavailableLabel;
  }

  if (items.length === 0) {
    return `No ${noun.many} in the next 2 weeks`;
  }

  if (needsResponse > 0) {
    return `${needsResponse} ${needsResponse === 1 ? noun.one : noun.many} need your response this week`;
  }

  const squads = squadCount(items);
  const squadLabel =
    options?.showSquadCount && squads > 1 ? `${squads} squads · ` : "";

  return `${squadLabel}${items.length} upcoming · next 2 weeks`;
}

function ScheduleEmptyState({
  icon: Icon,
  viewAllHref,
  viewAllLabel,
}: {
  icon: LucideIcon;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-2.5 py-4 text-center sm:min-h-[9.5rem] sm:gap-3 sm:px-6 sm:py-6">
      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-500 sm:h-10 sm:w-10">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} />
      </div>
      <Link
        href={withDashboardReturn(viewAllHref)}
        className="inline-flex max-w-full items-center justify-center gap-0.5 text-[11px] font-medium leading-snug text-zinc-500 transition-colors hover:text-jackals-red-light sm:gap-1 sm:text-xs"
      >
        <span className="truncate">{viewAllLabel}</span>
        <ChevronRight className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
      </Link>
    </div>
  );
}

export function DashboardUpcomingScheduleCard({
  icon: Icon,
  heading,
  shortHeading,
  summary,
  items,
  showTeamInMeta = false,
  unavailableMessage = null,
  topBanner = null,
  buildHref,
  viewAllHref,
  viewAllLabel,
}: {
  icon: LucideIcon;
  heading: string;
  shortHeading?: string;
  summary: string;
  items: DashboardScheduleItem[];
  showTeamInMeta?: boolean;
  unavailableMessage?: string | null;
  topBanner?: ReactNode;
  buildHref: (item: DashboardScheduleItem) => string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const preview = items.slice(0, DASHBOARD_SCHEDULE_PREVIEW_LIMIT);
  const remaining = items.length - preview.length;
  const compactHeading = shortHeading ?? heading;

  return (
    <section className="@container/dash-tile flex h-full min-w-0 flex-col">
      <div className="mb-2.5 flex min-h-[3.25rem] flex-col justify-end sm:mb-4 sm:min-h-[3.75rem]">
        <h2 className="font-display text-base font-semibold text-white sm:text-xl">
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <Icon className="h-4 w-4 shrink-0 text-jackals-red-light sm:h-5 sm:w-5" />
            <span className="@[16rem]/dash-tile:hidden">{compactHeading}</span>
            <span className="hidden @[16rem]/dash-tile:inline">{heading}</span>
          </span>
        </h2>
        <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-[11px] leading-snug text-zinc-500 sm:min-h-0 sm:text-xs">
          {summary}
        </p>
      </div>

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
        {topBanner}
        {unavailableMessage ? (
          <p className="flex flex-1 items-center justify-center px-2.5 py-4 text-center text-[11px] leading-snug text-zinc-500 sm:px-4 sm:py-6 sm:text-sm">
            {unavailableMessage}
          </p>
        ) : items.length === 0 ? (
          <ScheduleEmptyState
            icon={Icon}
            viewAllHref={viewAllHref}
            viewAllLabel={viewAllLabel}
          />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <StaggerIn className="divide-y divide-white/10" stagger={50}>
              {preview.map((item) => {
                const startDate = new Date(item.startDate);
                return (
                  <DashboardScheduleRow
                    key={item.id}
                    href={withDashboardReturn(buildHref(item))}
                    date={startDate}
                    title={item.title}
                    meta={buildScheduleMeta(startDate, {
                      teamName: item.teamName,
                      showTeam: showTeamInMeta,
                      location: item.location,
                    })}
                    status={item.userStatus}
                    eventDate={startDate}
                    dense
                  />
                );
              })}
            </StaggerIn>
            <Link
              href={withDashboardReturn(viewAllHref)}
              className="mt-auto flex items-center justify-center gap-1 border-t border-white/10 py-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light sm:py-2.5 sm:text-xs"
            >
              {remaining > 0 ? `+${remaining} · ` : ""}
              <span className="@[14rem]/dash-tile:hidden">View</span>
              <span className="hidden @[14rem]/dash-tile:inline">{viewAllLabel}</span>
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </div>
        )}
      </Card>
    </section>
  );
}

export function countNeedsResponse(items: DashboardScheduleItem[]) {
  return items.filter((item) =>
    itemNeedsUrgentResponse(item.userStatus, new Date(item.startDate)),
  ).length;
}
