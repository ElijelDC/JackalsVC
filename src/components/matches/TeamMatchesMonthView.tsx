"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { format, isPast, isSameMonth } from "date-fns";
import {
  ChevronRight as RowChevron,
  Clock,
  Lock,
  Trophy,
  Users,
  ChevronRight,
} from "lucide-react";
import { MonthNavigator } from "@/components/calendar/MonthNavigator";
import { CoachSquadRoleBadge } from "@/components/training/CoachSquadRoleBadge";
import { SquadBannerTeamFilter } from "@/components/training/SquadBannerTeamFilter";
import {
  TrainingAttendanceStatusBadge,
} from "@/components/training/TrainingAttendancePicker";
import { TrainingResponsesLockedBadge } from "@/components/training/TrainingResponsesLocked";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { ConditionalDashboardBackLink } from "@/components/dashboard/ConditionalDashboardBackLink";
import { appendReturnFrom, buildScheduleListHref, isDashboardReturn } from "@/lib/dashboard-return";
import {
  formatMatchTitle,
  formatMatchVenueLabel,
  formatMatchDateTime,
} from "@/lib/match-config";
import {
  canRespondToTrainingSession,
  getTrainingResponseOpensOn,
  sessionNeedsPlayerResponse,
  TRAINING_NEEDS_RESPONSE_LABEL,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import {
  formatTrainingMonthParam,
  type TrainingTeam,
} from "@/lib/training-teams-config";
import { cn } from "@/lib/utils";

export type TeamMatchListItem = {
  id: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  cancelled?: boolean;
  trainingTeamKey?: string;
  teamName?: string;
};

function buildMatchesQuery(
  month: Date,
  teamKey: string | null | undefined,
  returnFrom?: string | null,
) {
  return buildScheduleListHref("/matches", {
    month: formatTrainingMonthParam(month),
    team: teamKey || undefined,
    from: isDashboardReturn(returnFrom) ? "dashboard" : undefined,
  });
}

function MonthProgressBar({
  attending,
  total,
}: {
  attending: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((attending / total) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-400">This month</span>
        <span className="text-zinc-500">
          {attending} of {total} attending
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-jackals-red to-jackals-red-light transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NeedsResponseBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
      {TRAINING_NEEDS_RESPONSE_LABEL}
    </span>
  );
}

function MatchDateBlock({
  date,
  needsResponse = false,
  locked = false,
}: {
  date: Date;
  needsResponse?: boolean;
  locked?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border text-center",
        needsResponse && "border-amber-400/50 bg-amber-500/15",
        locked && "border-zinc-600/50 bg-zinc-500/10",
        !needsResponse && !locked && "border-jackals-red/25 bg-jackals-red/10",
      )}
    >
      {needsResponse && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-jackals-surface" />
      )}
      {locked && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 ring-2 ring-jackals-surface">
          <Lock className="h-2.5 w-2.5 text-zinc-300" aria-hidden />
        </span>
      )}
      <span
        className={cn(
          "text-[10px] font-semibold uppercase leading-none",
          needsResponse && "text-amber-200",
          locked && "text-zinc-500",
          !needsResponse && !locked && "text-jackals-red-light",
        )}
      >
        {format(date, "MMM")}
      </span>
      <span
        className={cn(
          "mt-0.5 text-xl font-bold leading-none",
          locked ? "text-zinc-400" : "text-white",
        )}
      >
        {format(date, "d")}
      </span>
    </div>
  );
}

function VenueBadge({ venue }: { venue: string }) {
  const isHome = venue === "HOME";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        isHome
          ? "border border-green-500/30 bg-green-500/10 text-green-300"
          : "border border-sky-500/30 bg-sky-500/10 text-sky-300",
      )}
    >
      {formatMatchVenueLabel(venue)}
    </span>
  );
}

export function TeamMatchesMonthView({
  team,
  teams = [],
  selectedTeamKey = null,
  month,
  matches,
  attendanceByMatchId,
  isCoach = false,
  returnFrom = null,
}: {
  team: TrainingTeam | null;
  teams?: TrainingTeam[];
  selectedTeamKey?: string | null;
  month: Date;
  matches: TeamMatchListItem[];
  attendanceByMatchId: Record<string, TrainingAttendanceStatus>;
  isCoach?: boolean;
  returnFrom?: string | null;
}) {
  const router = useRouter();
  const monthLabel = format(month, "MMMM yyyy");
  const now = new Date();
  const showTeamFilter = teams.length > 1;
  const isAllTeams = showTeamFilter && !selectedTeamKey;
  const squadTitle = isAllTeams
    ? "All teams"
    : (team?.name ?? teams[0]?.name ?? "Your squad");
  const activeCoachRole =
    selectedTeamKey != null
      ? teams.find((item) => item.key === selectedTeamKey)?.coachRole
      : null;
  const showCoachRoles = isCoach && teams.some((item) => item.coachRole);

  const upcomingMatches = matches.filter(
    (match) => !isPast(new Date(match.matchStart)),
  );
  const pastMatches = matches.filter((match) =>
    isPast(new Date(match.matchStart)),
  );
  const attendingUpcoming = upcomingMatches.filter(
    (match) =>
      !match.cancelled && attendanceByMatchId[match.id] === "ATTENDING",
  ).length;
  const unansweredUpcoming = upcomingMatches.filter((match) => {
    if (match.cancelled) return false;
    const status = attendanceByMatchId[match.id] ?? "UNANSWERED";
    return (
      status === "UNANSWERED" &&
      canRespondToTrainingSession(new Date(match.matchStart), now)
    );
  }).length;
  const hasUpcomingNotYetOpen = upcomingMatches.some((match) => {
    if (match.cancelled) return false;
    const status = attendanceByMatchId[match.id] ?? "UNANSWERED";
    return (
      status === "UNANSWERED" &&
      !canRespondToTrainingSession(new Date(match.matchStart), now)
    );
  });
  const needsResponseCount = upcomingMatches.filter((match) =>
    !match.cancelled &&
    sessionNeedsPlayerResponse(
      attendanceByMatchId[match.id] ?? "UNANSWERED",
      new Date(match.matchStart),
      now,
    ),
  ).length;

  const sortedUpcomingMatches = [...upcomingMatches].sort(
    (a, b) =>
      new Date(a.matchStart).getTime() - new Date(b.matchStart).getTime(),
  );

  const hasNextMonthSpillover = sortedUpcomingMatches.some(
    (match) => !isSameMonth(new Date(match.matchStart), month),
  );
  const pastLabel = pastMatches.some(
    (match) => !isSameMonth(new Date(match.matchStart), month),
  )
    ? "Earlier"
    : "Earlier this month";

  const navigateMonth = (target: Date) => {
    router.push(buildMatchesQuery(target, selectedTeamKey, returnFrom));
  };

  const editMatchesHref = selectedTeamKey
    ? `/coach/matches?team=${encodeURIComponent(selectedTeamKey)}`
    : "/coach/matches";

  return (
    <PageContainer>
      <ConditionalDashboardBackLink from={returnFrom} />
      <PageHeader
        title="Matches"
        description="Let coaches know if you're playing — same as training sign-ups."
      />

      <AnimateIn>
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
                <Users className="h-3.5 w-3.5" />
                Your squad
              </div>
              {showTeamFilter && (
                <SquadBannerTeamFilter
                  squads={teams}
                  value={selectedTeamKey ?? ""}
                  onChange={(value) => {
                    router.push(buildMatchesQuery(month, value || null, returnFrom));
                  }}
                />
              )}
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl font-semibold text-white">
                    {squadTitle}
                  </h2>
                  {activeCoachRole ? (
                    <CoachSquadRoleBadge role={activeCoachRole} />
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
                  {isAllTeams && showCoachRoles ? (
                    teams.map((item) => (
                      <span
                        key={item.key}
                        className="inline-flex flex-wrap items-center gap-2"
                      >
                        <span className="font-medium text-zinc-300">
                          {item.name}
                        </span>
                        {item.coachRole ? (
                          <CoachSquadRoleBadge role={item.coachRole} />
                        ) : null}
                      </span>
                    ))
                  ) : isAllTeams ? (
                    <span>{teams.map((item) => item.name).join(" · ")}</span>
                  ) : (
                    <>
                      {upcomingMatches.length} upcoming match
                      {upcomingMatches.length !== 1 ? "es" : ""} this month
                    </>
                  )}
                </div>
              </div>
              {isCoach && (
                <Link
                  href={editMatchesHref}
                  className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-jackals-red-light hover:text-jackals-red transition-colors"
                >
                  Edit matches
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <div className="mt-5">
              <MonthProgressBar
                attending={attendingUpcoming}
                total={upcomingMatches.length}
              />
            </div>
          </div>
        </div>

        <Card className="mb-6 min-w-0 overflow-hidden p-4">
          <MonthNavigator
            month={month}
            onMonthChange={navigateMonth}
            trailing={
              upcomingMatches.length > 0 ? (
                <p className="text-center text-sm text-zinc-500 sm:text-right">
                  {needsResponseCount > 0 ? (
                    <>
                      <span className="font-medium text-white">
                        {needsResponseCount}
                      </span>{" "}
                      match{needsResponseCount === 1 ? "" : "es"}{" "}
                      {needsResponseCount === 1 ? "needs" : "need"} your response
                      this week
                    </>
                  ) : unansweredUpcoming > 0 ? (
                    <>
                      <span className="font-medium text-white">
                        {unansweredUpcoming}
                      </span>{" "}
                      match{unansweredUpcoming === 1 ? "" : "es"}
                      {" "}
                      you haven&apos;t responded to yet
                    </>
                  ) : hasUpcomingNotYetOpen ? (
                    <>Responses open 2 weeks before each match</>
                  ) : (
                    <span className="text-green-400">You&apos;re all caught up</span>
                  )}
                </p>
              ) : undefined
            }
          />
        </Card>

        {matches.length === 0 ? (
          <Card className="py-12 text-center">
            <Trophy className="mx-auto h-8 w-8 text-zinc-600" />
            <CardTitle className="mt-4">No matches this month</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              When your squad has games scheduled, they&apos;ll show up here.
            </CardDescription>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">
                {monthLabel} schedule
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {hasNextMonthSpillover
                  ? needsResponseCount > 0
                    ? `Includes the rest of this week into next month. ${needsResponseCount} match${needsResponseCount === 1 ? "" : "es"} ${needsResponseCount === 1 ? "needs" : "need"} your response — highlighted below.`
                    : "Includes the rest of this week into next month so you don’t miss nearby matches."
                  : needsResponseCount > 0
                    ? `${needsResponseCount} match${needsResponseCount === 1 ? "" : "es"} ${needsResponseCount === 1 ? "needs" : "need"} your response this week — highlighted below.`
                    : unansweredUpcoming > 0
                      ? `${unansweredUpcoming} match${unansweredUpcoming === 1 ? "" : "es"} still ${unansweredUpcoming === 1 ? "needs" : "need"} a response.`
                      : hasUpcomingNotYetOpen
                        ? "Responses open 2 weeks before each match."
                        : "Open a match to respond and see who else is playing."}
              </p>
            </div>

            <StaggerIn className="divide-y divide-white/10" stagger={50}>
              {sortedUpcomingMatches.map((match, index) => {
                const matchDate = new Date(match.matchStart);
                const previousDate =
                  index > 0
                    ? new Date(sortedUpcomingMatches[index - 1]!.matchStart)
                    : null;
                const showWeekSpilloverDivider =
                  previousDate != null &&
                  isSameMonth(previousDate, month) &&
                  !isSameMonth(matchDate, month);
                const userStatus = attendanceByMatchId[match.id] ?? "UNANSWERED";
                const isCancelled = match.cancelled === true;
                const canRespond =
                  !isCancelled && canRespondToTrainingSession(matchDate, now);
                const needsResponse =
                  !isCancelled &&
                  sessionNeedsPlayerResponse(userStatus, matchDate, now);
                const isLocked =
                  !isCancelled && userStatus === "UNANSWERED" && !canRespond;
                const opensOn = getTrainingResponseOpensOn(matchDate);
                const href = appendReturnFrom(`/matches/${match.id}`, returnFrom);
                const rowClassName = cn(
                  "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                  isCancelled &&
                    "cursor-not-allowed border-l-2 border-l-zinc-600/50 bg-zinc-500/[0.04] opacity-60",
                  !isCancelled &&
                    !isLocked &&
                    "transition-colors hover:bg-white/[0.03]",
                  !isCancelled &&
                    userStatus === "ATTENDING" &&
                    "bg-green-500/[0.06]",
                  !isCancelled &&
                    userStatus === "NOT_ATTENDING" &&
                    "border-l-2 border-l-rose-400/70 bg-rose-500/[0.1]",
                  needsResponse &&
                    "border-l-2 border-l-amber-400/70 bg-amber-500/[0.08] ring-1 ring-inset ring-amber-400/10",
                  isLocked &&
                    "cursor-not-allowed border-l-2 border-dashed border-l-zinc-600/60 bg-zinc-500/[0.04] opacity-80",
                );
                const rowContent = (
                  <>
                    <div className="flex min-w-0 items-center gap-4">
                      <MatchDateBlock
                        date={matchDate}
                        needsResponse={needsResponse}
                        locked={isLocked || isCancelled}
                      />
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-medium",
                            isCancelled || isLocked
                              ? "text-zinc-400 line-through decoration-zinc-600"
                              : "text-white",
                          )}
                        >
                          {formatMatchTitle(match.opponentName, match.venue)}
                          {isAllTeams && match.teamName ? (
                            <span className="ml-2 text-sm font-normal text-zinc-500">
                              · {match.teamName}
                            </span>
                          ) : null}
                        </p>
                        {!isCancelled && (
                          <p className="mt-0.5 truncate text-sm text-zinc-500">
                            {match.location} · {formatMatchDateTime(match.warmUpTime, match.matchStart).timeLabel}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {isCancelled ? (
                            <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                              Cancelled
                            </Badge>
                          ) : (
                            <>
                              <VenueBadge venue={match.venue} />
                              {needsResponse ? (
                                <NeedsResponseBadge />
                              ) : userStatus !== "UNANSWERED" ? (
                                <TrainingAttendanceStatusBadge status={userStatus} />
                              ) : isLocked ? (
                                <TrainingResponsesLockedBadge opensOn={opensOn} />
                              ) : (
                                <TrainingAttendanceStatusBadge status={userStatus} />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "flex shrink-0 items-center gap-2 text-sm sm:pl-4",
                        isCancelled && "text-zinc-600",
                        needsResponse && "font-semibold text-amber-200",
                        isLocked && "text-zinc-500",
                        !needsResponse &&
                          !isLocked &&
                          !isCancelled &&
                          "font-medium text-jackals-red-light",
                      )}
                    >
                      {isCancelled ? (
                        "Match cancelled"
                      ) : needsResponse ? (
                        <>
                          Respond now
                          <RowChevron className="h-4 w-4" />
                        </>
                      ) : isLocked ? (
                        <>
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          Opens {format(opensOn, "d MMM")}
                        </>
                      ) : (
                        <>
                          View match
                          <RowChevron className="h-4 w-4" />
                        </>
                      )}
                    </div>
                  </>
                );

                return (
                  <Fragment key={match.id}>
                    {showWeekSpilloverDivider ? (
                      <div className="bg-jackals-inset/50 px-5 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                          Continues into {format(matchDate, "MMMM")}
                        </p>
                      </div>
                    ) : null}
                    {isLocked || isCancelled ? (
                      <div className={rowClassName} aria-disabled="true">
                        {rowContent}
                      </div>
                    ) : (
                      <Link href={href} className={rowClassName}>
                        {rowContent}
                      </Link>
                    )}
                  </Fragment>
                );
              })}

              {pastMatches.length > 0 && sortedUpcomingMatches.length > 0 && (
                <div className="bg-jackals-inset/50 px-5 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    {pastLabel}
                  </p>
                </div>
              )}

              {pastMatches.map((match) => {
                const matchDate = new Date(match.matchStart);
                const userStatus = attendanceByMatchId[match.id] ?? "UNANSWERED";
                const isCancelled = match.cancelled === true;

                const row = (
                  <>
                    <MatchDateBlock date={matchDate} locked={isCancelled} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          isCancelled
                            ? "text-zinc-500 line-through decoration-zinc-600"
                            : "text-zinc-400",
                        )}
                      >
                        {format(matchDate, "EEEE d MMMM")}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {formatMatchTitle(match.opponentName, match.venue)}
                        {isAllTeams && match.teamName ? (
                          <span className="ml-1 text-zinc-600">
                            · {match.teamName}
                          </span>
                        ) : null}
                      </p>
                      {isCancelled ? (
                        <div className="mt-1">
                          <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                            Cancelled
                          </Badge>
                        </div>
                      ) : (
                        userStatus !== "UNANSWERED" && (
                          <div className="mt-1">
                            <TrainingAttendanceStatusBadge status={userStatus} />
                          </div>
                        )
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-600">
                      {isCancelled ? (
                        "Cancelled"
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          Past
                        </>
                      )}
                    </span>
                  </>
                );

                return isCancelled ? (
                  <div
                    key={match.id}
                    className="flex items-center gap-4 px-5 py-3 opacity-60"
                    aria-disabled="true"
                  >
                    {row}
                  </div>
                ) : (
                  <Link
                    key={match.id}
                    href={appendReturnFrom(`/matches/${match.id}`, returnFrom)}
                    className="flex items-center gap-4 px-5 py-3 opacity-60 transition-opacity hover:opacity-80"
                  >
                    {row}
                  </Link>
                );
              })}
            </StaggerIn>
          </Card>
        )}
      </AnimateIn>
    </PageContainer>
  );
}

export function NoMatchTeamAssigned({ squads }: { squads: TrainingTeam[] }) {
  return (
    <PageContainer>
      <PageHeader
        title="Matches"
        description="Your squad's games will appear here once you're assigned to a team."
      />

      <AnimateIn>
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-jackals-red/5 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
              <Users className="h-7 w-7" />
            </div>
            <CardTitle>No team assigned yet</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              An admin needs to assign you to a squad before you can see match
              schedules.
            </CardDescription>
          </div>

          <div className="divide-y divide-white/10">
            {squads.map((team) => (
              <div
                key={team.key}
                className="flex items-center justify-between gap-4 px-6 py-4"
              >
                <p className="font-medium text-white">{team.name}</p>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
                  {team.dayLabel}
                </span>
              </div>
            ))}
          </div>

          <p className="border-t border-white/10 px-6 py-4 text-center text-sm text-zinc-500">
            Contact the club committee if you think this is a mistake.
          </p>
        </Card>
      </AnimateIn>
    </PageContainer>
  );
}
