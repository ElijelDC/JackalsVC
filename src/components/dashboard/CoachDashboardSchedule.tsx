"use client";

import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, ChevronRight, Swords } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import {
  getDashboardResponseDisplay,
  itemNeedsUrgentResponse,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";

const COACH_PREVIEW_LIMIT = 3;

export type CoachScheduleItem = {
  id: string;
  title: string;
  teamName?: string | null;
  teamKey?: string | null;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

function squadCount(items: CoachScheduleItem[]) {
  return new Set(items.map((item) => item.teamName).filter(Boolean)).size;
}

function scheduleSummary(
  items: CoachScheduleItem[],
  showSquadCount: boolean,
  needsResponse: number,
  noun: { one: string; many: string },
) {
  if (items.length === 0) {
    return `No ${noun.many} in the next 2 weeks`;
  }

  if (needsResponse > 0) {
    return `${needsResponse} ${needsResponse === 1 ? noun.one : noun.many} need your response this week`;
  }

  const squadLabel =
    showSquadCount && squadCount(items) > 1
      ? `${squadCount(items)} squads · `
      : "";

  return `${squadLabel}${items.length} upcoming · next 2 weeks`;
}

function buildTeamViewAllHref(basePath: string, teamKey: string) {
  if (!teamKey) return basePath;
  return `${basePath}?team=${encodeURIComponent(teamKey)}`;
}

function TeamPill({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[9rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
      {name}
    </span>
  );
}

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-white/10 bg-jackals-surface text-center">
      <span className="text-[10px] font-medium uppercase leading-none text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="text-sm font-bold leading-tight text-white">
        {format(date, "d")}
      </span>
    </div>
  );
}

function ScheduleRow({
  href,
  date,
  title,
  teamName,
  showTeam,
  meta,
  status,
  eventDate,
}: {
  href: string;
  date: Date;
  title: string;
  teamName?: string | null;
  showTeam: boolean;
  meta: string;
  status: TrainingAttendanceStatus;
  eventDate: Date;
}) {
  const display = getDashboardResponseDisplay(status, eventDate);

  return (
    <Link
      href={href}
      className="group flex items-start gap-2.5 px-3 py-3 transition-colors hover:bg-white/[0.03] sm:px-4"
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium leading-snug text-white">{title}</p>
          {showTeam && teamName ? <TeamPill name={teamName} /> : null}
        </div>
        <p className="mt-1 truncate text-xs text-zinc-500">{meta}</p>
        {display.needsUrgentResponse ? (
          <div className="mt-1.5">
            <Badge className={display.badgeClassName}>{display.label}</Badge>
          </div>
        ) : null}
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
    </Link>
  );
}

function CoachScheduleCard({
  icon: Icon,
  heading,
  summary,
  items,
  showTeam,
  emptyMessage,
  buildHref,
  buildMeta,
  viewAllHref,
  viewAllLabel,
}: {
  icon: LucideIcon;
  heading: string;
  summary: string;
  items: CoachScheduleItem[];
  showTeam: boolean;
  emptyMessage: string;
  buildHref: (item: CoachScheduleItem) => string;
  buildMeta: (item: CoachScheduleItem, date: Date) => string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const preview = items.slice(0, COACH_PREVIEW_LIMIT);
  const remaining = items.length - preview.length;

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <Icon className="h-5 w-5 shrink-0 text-jackals-red-light" />
            {heading}
          </span>
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{summary}</p>
      </div>

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            {emptyMessage}
          </p>
        ) : (
          <StaggerIn className="divide-y divide-white/10" stagger={50}>
            {preview.map((item) => {
              const startDate = new Date(item.startDate);
              return (
                <ScheduleRow
                  key={item.id}
                  href={buildHref(item)}
                  date={startDate}
                  title={item.title}
                  teamName={item.teamName}
                  showTeam={showTeam}
                  meta={buildMeta(item, startDate)}
                  status={item.userStatus}
                  eventDate={startDate}
                />
              );
            })}
            <Link
              href={viewAllHref}
              className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
            >
              {remaining > 0 ? `+${remaining} more · ` : ""}
              {viewAllLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </StaggerIn>
        )}
      </Card>
    </section>
  );
}

export function CoachUpcomingTrainingCard({
  sessions,
  selectedTeamKey = "",
  multiTeam = false,
  emptyMessage = "No training sessions in the next 2 weeks.",
}: {
  sessions: CoachScheduleItem[];
  selectedTeamKey?: string;
  multiTeam?: boolean;
  emptyMessage?: string;
}) {
  const needsResponse = sessions.filter((session) =>
    itemNeedsUrgentResponse(session.userStatus, new Date(session.startDate)),
  ).length;
  const showTeam = multiTeam && !selectedTeamKey;

  return (
    <CoachScheduleCard
      icon={CalendarDays}
      heading="Upcoming training"
      summary={scheduleSummary(sessions, showTeam, needsResponse, {
        one: "session",
        many: "sessions",
      })}
      items={sessions}
      showTeam={showTeam}
      emptyMessage={emptyMessage}
      buildHref={(item) => `/training/session/${item.id}`}
      buildMeta={(_item, date) =>
        `${format(date, "EEE HH:mm")}${_item.location ? ` · ${_item.location}` : ""}`
      }
      viewAllHref={buildTeamViewAllHref("/training", selectedTeamKey)}
      viewAllLabel="All training"
    />
  );
}

export function CoachUpcomingMatchesCard({
  matches,
  selectedTeamKey = "",
  multiTeam = false,
  emptyMessage = "No matches in the next 2 weeks.",
}: {
  matches: CoachScheduleItem[];
  selectedTeamKey?: string;
  multiTeam?: boolean;
  emptyMessage?: string;
}) {
  const needsResponse = matches.filter((match) =>
    itemNeedsUrgentResponse(match.userStatus, new Date(match.startDate)),
  ).length;
  const showTeam = multiTeam && !selectedTeamKey;

  return (
    <CoachScheduleCard
      icon={Swords}
      heading="Upcoming matches"
      summary={scheduleSummary(matches, showTeam, needsResponse, {
        one: "match",
        many: "matches",
      })}
      items={matches}
      showTeam={showTeam}
      emptyMessage={emptyMessage}
      buildHref={(item) => `/matches/${item.id}`}
      buildMeta={(_item, date) =>
        `${format(date, "EEE HH:mm")}${_item.location ? ` · ${_item.location}` : ""}`
      }
      viewAllHref={buildTeamViewAllHref("/matches", selectedTeamKey)}
      viewAllLabel="All matches"
    />
  );
}
