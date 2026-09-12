"use client";

import Link from "next/link";
import { format, isPast, isToday, parseISO } from "date-fns";
import {
  CalendarRange,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { ConditionalDashboardBackLink } from "@/components/dashboard/ConditionalDashboardBackLink";
import { squadShortLabel } from "@/lib/admin-members-hub";
import {
  appendReturnFrom,
  isDashboardReturn,
} from "@/lib/dashboard-return";
import { FIXTURES_ALL_TEAMS } from "@/lib/fixtures";
import {
  formatMatchDateTime,
  formatMatchTitle,
  formatMatchVenueLabel,
} from "@/lib/match-config";
import { groupItemsByMonthParam } from "@/lib/schedule-month-groups";
import type { TrainingTeam } from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export { FIXTURES_ALL_TEAMS };

export type SeasonFixtureItem = {
  id: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  cancelled: boolean;
  trainingTeamKey: string;
  teamName: string;
};

function fixturesHref(team: string, returnFrom?: string | null) {
  const params = new URLSearchParams();
  params.set("team", team || FIXTURES_ALL_TEAMS);
  if (isDashboardReturn(returnFrom)) params.set("from", "dashboard");
  return `/fixtures?${params.toString()}`;
}

function TeamFilter({
  teams,
  selectedTeamKey,
  memberTeamKey,
  returnFrom,
}: {
  teams: TrainingTeam[];
  selectedTeamKey: string;
  memberTeamKey: string | null;
  returnFrom?: string | null;
}) {
  const ordered = [
    ...teams.filter((team) => team.key === memberTeamKey),
    ...teams.filter((team) => team.key !== memberTeamKey),
  ];

  const options = [
    {
      key: FIXTURES_ALL_TEAMS,
      label: "All teams",
      hint: null as string | null,
    },
    ...ordered.map((team) => ({
      key: team.key,
      label: squadShortLabel(team.key)?.toUpperCase() ?? team.name,
      hint: memberTeamKey === team.key ? "Your squad" : team.name,
    })),
  ];

  return (
    <nav aria-label="Filter fixtures by team" className="w-full">
      <div
        className={cn(
          "grid gap-1.5",
          options.length <= 4
            ? "grid-cols-4"
            : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5",
        )}
      >
        {options.map((option) => {
          const selected = selectedTeamKey === option.key;
          const isMine = option.key === memberTeamKey;
          return (
            <Link
              key={option.key}
              href={fixturesHref(option.key, returnFrom)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              aria-label={
                isMine ? `${option.label}, your squad` : undefined
              }
              title={option.hint ?? option.label}
              className={cn(
                "relative z-0 isolate flex min-h-11 min-w-0 items-center justify-center overflow-hidden rounded-full border px-1.5 py-1.5 text-center transition-all sm:px-2.5",
                selected
                  ? "border-jackals-red/50 bg-jackals-red/15 text-white shadow-[0_0_20px_rgba(232,34,42,0.15)]"
                  : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-zinc-200",
                isMine && !selected && "border-jackals-red/25",
              )}
            >
              <span className="relative z-10 truncate text-[10px] font-semibold uppercase tracking-wider sm:text-xs">
                {option.label}
              </span>
              {isMine ? (
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute bottom-1.5 left-1/2 z-0 h-0.5 w-3.5 -translate-x-1/2 rounded-full",
                    selected ? "bg-jackals-red-light" : "bg-jackals-red/60",
                  )}
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function FixtureRow({
  match,
  isMemberTeam,
  showTeamLabel,
  returnFrom,
}: {
  match: SeasonFixtureItem;
  isMemberTeam: boolean;
  showTeamLabel: boolean;
  returnFrom?: string | null;
}) {
  const kickOff = parseISO(match.matchStart);
  const past = isPast(kickOff) && !isToday(kickOff);
  const { dateLabel, timeLabel } = formatMatchDateTime(
    match.warmUpTime,
    match.matchStart,
  );
  const href = appendReturnFrom(`/matches/${match.id}`, returnFrom);
  const squadCode =
    squadShortLabel(match.trainingTeamKey)?.toUpperCase() ?? null;
  const teamLabel = squadCode ?? match.teamName;

  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-[5.75rem] items-stretch gap-3 px-4 py-3.5 transition-colors sm:min-h-[6.25rem] sm:gap-4 sm:px-5",
        past
          ? "bg-transparent opacity-55 hover:opacity-80"
          : "hover:bg-white/[0.03]",
        isMemberTeam && !past && "bg-jackals-red/[0.03]",
      )}
    >
      <div
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center border text-center sm:w-16",
          isMemberTeam
            ? "border-jackals-red/30 bg-jackals-red/10"
            : "border-white/10 bg-jackals-surface",
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {format(kickOff, "MMM")}
        </span>
        <span className="font-display text-xl font-semibold leading-none text-white sm:text-2xl">
          {format(kickOff, "d")}
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-zinc-500">
          {format(kickOff, "EEE")}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex min-h-[1.5rem] items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-display text-base font-semibold text-white sm:text-lg">
            {formatMatchTitle(match.opponentName, match.venue)}
          </p>
          {showTeamLabel && teamLabel ? (
            <span
              title={match.teamName}
              className="shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400"
            >
              {teamLabel}
            </span>
          ) : null}
          {match.cancelled ? (
            <Badge className="shrink-0 border-red-500/40 bg-red-500/15 text-red-200">
              Cancelled
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-zinc-400">{dateLabel}</p>
        <div className="mt-1.5 flex min-w-0 items-center gap-x-3 overflow-hidden text-xs text-zinc-500">
          <span
            className={cn(
              "shrink-0 font-semibold uppercase tracking-wider",
              match.venue === "HOME" ? "text-emerald-300/90" : "text-sky-300/90",
            )}
          >
            {formatMatchVenueLabel(match.venue)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{match.location}</span>
          </span>
          <span className="hidden shrink-0 sm:inline">{timeLabel}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-zinc-400 sm:hidden">
            {timeLabel}
          </span>
        </div>
      </div>

      <ChevronRight className="mt-auto mb-auto h-4 w-4 shrink-0 self-center text-zinc-600 transition-colors group-hover:text-jackals-red-light" />
    </Link>
  );
}

export function SeasonFixturesView({
  teams,
  matches,
  selectedTeamKey,
  memberTeamKey,
  returnFrom,
}: {
  teams: TrainingTeam[];
  matches: SeasonFixtureItem[];
  selectedTeamKey: string;
  memberTeamKey: string | null;
  returnFrom?: string | null;
}) {
  const now = new Date();
  const upcomingCount = matches.filter(
    (match) => !match.cancelled && parseISO(match.matchStart) >= now,
  ).length;
  const monthGroups = groupItemsByMonthParam(matches, (match) =>
    parseISO(match.matchStart),
  );

  const selectedTeam =
    selectedTeamKey === FIXTURES_ALL_TEAMS
      ? null
      : teams.find((team) => team.key === selectedTeamKey) ?? null;
  const showTeamLabel = selectedTeamKey === FIXTURES_ALL_TEAMS;

  return (
    <PageContainer className="py-8 sm:py-12">
      <ConditionalDashboardBackLink from={returnFrom} />

      <AnimateIn>
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            title="Season fixtures"
            description={
              selectedTeam
                ? `${selectedTeam.name} · full 2026/27 match schedule`
                : "All Jackals squads · full 2026/27 match schedule"
            }
            className="mb-0"
          />
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <CalendarRange className="h-4 w-4 text-jackals-red-light" />
            <span>
              {matches.length} fixture{matches.length === 1 ? "" : "s"}
              {upcomingCount > 0 ? ` · ${upcomingCount} upcoming` : ""}
            </span>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={40}>
        <Card className="mb-6 border-jackals-red/15 bg-gradient-to-br from-jackals-red/[0.06] to-transparent p-4 sm:mb-8 sm:p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            View by team
          </p>
          <TeamFilter
            teams={teams}
            selectedTeamKey={selectedTeamKey}
            memberTeamKey={memberTeamKey}
            returnFrom={returnFrom}
          />
        </Card>
      </AnimateIn>

      {matches.length === 0 ? (
        <Card className="p-8 text-center">
          <CardTitle className="text-lg">No fixtures yet</CardTitle>
          <CardDescription className="mt-2">
            Match dates will appear here once the season schedule is published.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-6">
          {monthGroups.map(([monthKey, monthMatches], index) => {
            const monthDate = parseISO(`${monthKey}-01`);
            return (
              <AnimateIn key={monthKey} delay={60 + index * 30}>
                <section>
                  <div className="mb-3 flex items-end justify-between gap-3 px-1">
                    <h2 className="font-display text-xl font-semibold text-white">
                      {format(monthDate, "MMMM yyyy")}
                    </h2>
                    <span className="text-xs text-zinc-500">
                      {monthMatches.length} match
                      {monthMatches.length === 1 ? "" : "es"}
                    </span>
                  </div>
                  <Card className="overflow-hidden p-0">
                    <StaggerIn
                      className="divide-y divide-white/10"
                      stagger={40}
                    >
                      {monthMatches.map((match) => (
                        <FixtureRow
                          key={match.id}
                          match={match}
                          isMemberTeam={
                            Boolean(memberTeamKey) &&
                            match.trainingTeamKey === memberTeamKey
                          }
                          showTeamLabel={showTeamLabel}
                          returnFrom={returnFrom}
                        />
                      ))}
                    </StaggerIn>
                  </Card>
                </section>
              </AnimateIn>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
