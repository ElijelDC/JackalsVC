"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Children } from "react";
import type { DashboardScheduleItem } from "@/components/dashboard/dashboard-types";
import { Card } from "@/components/ui/Card";
import {
  buildScheduleMeta,
  DashboardScheduleRow,
} from "@/components/dashboard/DashboardScheduleRow";
import { itemNeedsUrgentResponse } from "@/lib/training-attendance-config";
import { withDashboardReturn } from "@/lib/dashboard-return";
import { DASHBOARD_SCHEDULE_PREVIEW_LIMIT } from "@/lib/dashboard-schedule-config";
import { cn } from "@/lib/utils";

export const DASHBOARD_TILE_CARD_CLASS =
  "flex h-full min-h-[12.75rem] min-w-0 flex-1 flex-col overflow-hidden p-0 sm:min-h-[14rem]";

export const DASHBOARD_TILE_FOOTER_CLASS =
  "mt-auto flex h-9 shrink-0 items-center justify-center gap-1 border-t border-white/10 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light";

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
    return `No ${noun.many} soon`;
  }

  if (needsResponse > 0) {
    const verb = needsResponse === 1 ? "needs" : "need";
    return `${needsResponse} ${needsResponse === 1 ? noun.one : noun.many} ${verb} a reply`;
  }

  const squads = squadCount(items);
  const squadLabel =
    options?.showSquadCount && squads > 1 ? `${squads} squads · ` : "";

  return `${squadLabel}${items.length} upcoming`;
}

export function DashboardTileHeader({
  icon: Icon,
  title,
  shortTitle,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  shortTitle?: string;
  subtitle: string;
}) {
  return (
    <div className="mb-2.5 min-h-[2.85rem] sm:mb-3 sm:min-h-[3.1rem]">
      <h2 className="font-display text-[0.95rem] font-semibold tracking-wide text-white sm:text-xl">
        <span className="inline-flex items-center gap-1.5 sm:gap-2">
          <Icon className="h-4 w-4 shrink-0 text-jackals-red-light sm:h-5 sm:w-5" />
          <span className="sm:hidden">{shortTitle ?? title}</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
      </h2>
      <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500 sm:text-xs">{subtitle}</p>
    </div>
  );
}

function ScheduleEmptyState({
  viewAllHref,
  viewAllLabel,
}: {
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-3 py-6 text-center">
      <p className="text-xs text-zinc-500">Nothing scheduled yet</p>
      <Link
        href={withDashboardReturn(viewAllHref)}
        className="mt-2 text-[11px] font-medium text-jackals-red-light hover:text-jackals-red"
      >
        {viewAllLabel}
      </Link>
    </div>
  );
}

/** Two equal-height slots so panels stay symmetrical with 1 or 2 items. */
export function DashboardTileSlots({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const slots = Children.toArray(children).filter(Boolean);
  while (slots.length < DASHBOARD_SCHEDULE_PREVIEW_LIMIT) {
    slots.push(<div key={`empty-${slots.length}`} className="h-full" aria-hidden />);
  }

  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 grid-rows-2 divide-y divide-white/10",
        className,
      )}
    >
      {slots.slice(0, DASHBOARD_SCHEDULE_PREVIEW_LIMIT).map((slot, index) => (
        <div key={index} className="min-h-0 overflow-hidden">
          {slot}
        </div>
      ))}
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

  return (
    <section className="flex h-full min-w-0 flex-col">
      <DashboardTileHeader
        icon={Icon}
        title={heading}
        shortTitle={shortHeading}
        subtitle={summary}
      />

      <Card className={DASHBOARD_TILE_CARD_CLASS}>
        {topBanner}
        {unavailableMessage ? (
          <p className="flex flex-1 items-center justify-center px-3 py-5 text-center text-xs leading-snug text-zinc-500">
            {unavailableMessage}
          </p>
        ) : items.length === 0 ? (
          <ScheduleEmptyState viewAllHref={viewAllHref} viewAllLabel={viewAllLabel} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <DashboardTileSlots>
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
                  />
                );
              })}
            </DashboardTileSlots>
            <Link
              href={withDashboardReturn(viewAllHref)}
              className={DASHBOARD_TILE_FOOTER_CLASS}
            >
              {remaining > 0 ? `+${remaining} · ` : ""}
              View all
              <ChevronRight className="h-3 w-3" />
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
