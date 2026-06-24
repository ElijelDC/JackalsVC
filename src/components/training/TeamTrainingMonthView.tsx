"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, isPast } from "date-fns";
import {
  CalendarDays,
  ChevronRight as RowChevron,
  Clock,
  Lock,
  Users,
  ChevronRight,
} from "lucide-react";
import { MonthNavigator } from "@/components/calendar/MonthNavigator";
import {
  TrainingAttendanceStatusBadge,
} from "@/components/training/TrainingAttendancePicker";
import { TrainingResponsesLockedBadge } from "@/components/training/TrainingResponsesLocked";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import {
  sessionNeedsPlayerResponse,
  canRespondToTrainingSession,
  getTrainingResponseOpensOn,
  TRAINING_NEEDS_RESPONSE_LABEL,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import {
  formatTrainingMonthParam,
  type TrainingTeam,
} from "@/lib/training-teams-config";
import { formatEventDateTime } from "@/lib/event-display";
import { cn } from "@/lib/utils";

type TrainingEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  cancelled?: boolean;
};

type SessionTimes = {
  startTime: string;
  endTime: string;
};

function MonthProgressBar({
  attending,
  total,
  upcoming,
}: {
  attending: number;
  total: number;
  upcoming: number;
}) {
  const pct =
    upcoming > 0 ? Math.round((attending / upcoming) * 100) : total > 0 ? 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-400">This month</span>
        <span className="text-zinc-500">
          {attending} of {upcoming > 0 ? upcoming : total} attending
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

function SessionDateBlock({
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

export function TeamTrainingMonthView({
  team,
  month,
  events,
  sessionTimes,
  attendanceByEventId,
  isCoach = false,
}: {
  team: TrainingTeam;
  month: Date;
  events: TrainingEvent[];
  sessionTimes?: SessionTimes | null;
  attendanceByEventId: Record<string, TrainingAttendanceStatus>;
  isCoach?: boolean;
}) {
  const router = useRouter();
  const monthLabel = format(month, "MMMM yyyy");
  const now = new Date();

  const upcomingEvents = events.filter((event) => !isPast(new Date(event.startDate)));
  const pastEvents = events.filter((event) => isPast(new Date(event.startDate)));
  const attendingUpcoming = upcomingEvents.filter(
    (event) => attendanceByEventId[event.id] === "ATTENDING",
  ).length;
  const unansweredUpcoming = upcomingEvents.filter((event) => {
    const status = attendanceByEventId[event.id] ?? "UNANSWERED";
    return (
      status === "UNANSWERED" &&
      canRespondToTrainingSession(new Date(event.startDate), now)
    );
  }).length;
  const hasUpcomingNotYetOpen = upcomingEvents.some((event) => {
    const status = attendanceByEventId[event.id] ?? "UNANSWERED";
    return (
      status === "UNANSWERED" &&
      !canRespondToTrainingSession(new Date(event.startDate), now)
    );
  });
  const needsResponseCount = upcomingEvents.filter((event) =>
    sessionNeedsPlayerResponse(
      attendanceByEventId[event.id] ?? "UNANSWERED",
      new Date(event.startDate),
      now,
    ),
  ).length;

  const sortedUpcomingEvents = [...upcomingEvents].sort((a, b) => {
    const aNeedsResponse = sessionNeedsPlayerResponse(
      attendanceByEventId[a.id] ?? "UNANSWERED",
      new Date(a.startDate),
      now,
    );
    const bNeedsResponse = sessionNeedsPlayerResponse(
      attendanceByEventId[b.id] ?? "UNANSWERED",
      new Date(b.startDate),
      now,
    );
    if (aNeedsResponse !== bNeedsResponse) return aNeedsResponse ? -1 : 1;
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });

  const navigateMonth = (target: Date) => {
    router.push(`/training?month=${formatTrainingMonthParam(target)}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Training"
        description="Sign up for each session so coaches know you're coming."
      />

      <AnimateIn>
        {/* Squad banner */}
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <Users className="h-3.5 w-3.5" />
              Your squad
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-display text-2xl font-semibold text-white">
                  {team.name}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-jackals-red-light" />
                    Every {team.dayLabel}
                  </span>
                  {sessionTimes && (
                    <span className="inline-flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-jackals-red-light" />
                      {sessionTimes.startTime} – {sessionTimes.endTime}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isCoach && (
                  <Link
                    href="/coach/training"
                    className="inline-flex items-center gap-1 shrink-0 text-xs font-medium text-jackals-red-light hover:text-jackals-red transition-colors"
                  >
                    Edit schedule
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-5">
              <MonthProgressBar
                attending={attendingUpcoming}
                total={events.length}
                upcoming={upcomingEvents.length}
              />
            </div>
          </div>
        </div>

        {/* Month navigator */}
        <Card className="mb-6 p-4">
          <MonthNavigator
            month={month}
            onMonthChange={navigateMonth}
            trailing={
              upcomingEvents.length > 0 ? (
                <p className="text-center text-sm text-zinc-500 sm:text-right">
                  {needsResponseCount > 0 ? (
                    <>
                      <span className="font-medium text-white">
                        {needsResponseCount}
                      </span>{" "}
                      session{needsResponseCount === 1 ? "" : "s"}{" "}
                      {needsResponseCount === 1 ? "needs" : "need"} your response
                      this week
                    </>
                  ) : unansweredUpcoming > 0 ? (
                    <>
                      <span className="font-medium text-white">
                        {unansweredUpcoming}
                      </span>{" "}
                      session{unansweredUpcoming === 1 ? "" : "s"} you haven&apos;t
                      responded to yet
                    </>
                  ) : hasUpcomingNotYetOpen ? (
                    <>Responses open 2 weeks before each session</>
                  ) : (
                    <span className="text-green-400">You&apos;re all caught up</span>
                  )}
                </p>
              ) : undefined
            }
          />
        </Card>

        {events.length === 0 ? (
          <Card className="py-12 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-zinc-600" />
            <CardTitle className="mt-4">No sessions this month</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-sm">
              There are no {team.dayLabel.toLowerCase()} trainings scheduled for{" "}
              {monthLabel}. Try another month or contact the club if this looks wrong.
            </CardDescription>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-400">
                {monthLabel} schedule
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {needsResponseCount > 0
                  ? `${needsResponseCount} session${needsResponseCount === 1 ? "" : "s"} need your response this week — highlighted below.`
                  : unansweredUpcoming > 0
                    ? `${unansweredUpcoming} session${unansweredUpcoming === 1 ? "" : "s"} still need a response.`
                    : hasUpcomingNotYetOpen
                      ? "Responses open 2 weeks before each session."
                      : "Open a session to respond and see who else is coming."}
              </p>
            </div>

            <StaggerIn className="divide-y divide-white/10" stagger={50}>
              {sortedUpcomingEvents.map((event) => {
                const eventDate = new Date(event.startDate);
                const { timeLabel } = formatEventDateTime(
                  event.startDate,
                  event.endDate,
                );
                const userStatus = attendanceByEventId[event.id] ?? "UNANSWERED";
                const isCancelled = event.cancelled === true;
                const canRespond =
                  !isCancelled && canRespondToTrainingSession(eventDate, now);
                const needsResponse =
                  !isCancelled &&
                  sessionNeedsPlayerResponse(userStatus, eventDate, now);
                const isLocked =
                  !isCancelled && userStatus === "UNANSWERED" && !canRespond;
                const opensOn = getTrainingResponseOpensOn(eventDate);
                const href = `/training/session/${event.id}`;
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
                      <SessionDateBlock
                        date={eventDate}
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
                          {format(eventDate, "EEEE")}
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 flex items-center gap-1.5 text-sm",
                            isCancelled ? "text-zinc-600" : "text-zinc-500",
                          )}
                        >
                          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {timeLabel}
                        </p>
                        {!isCancelled && (
                          <p className="mt-0.5 truncate text-sm text-zinc-600">
                            {event.title}
                          </p>
                        )}
                        <div className="mt-2">
                          {isCancelled ? (
                            <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                              Cancelled
                            </Badge>
                          ) : needsResponse ? (
                            <NeedsResponseBadge />
                          ) : userStatus !== "UNANSWERED" ? (
                            <TrainingAttendanceStatusBadge status={userStatus} />
                          ) : isLocked ? (
                            <TrainingResponsesLockedBadge opensOn={opensOn} />
                          ) : (
                            <TrainingAttendanceStatusBadge status={userStatus} />
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
                        "Session cancelled"
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
                          View session
                          <RowChevron className="h-4 w-4" />
                        </>
                      )}
                    </div>
                  </>
                );

                return isLocked || isCancelled ? (
                  <div
                    key={event.id}
                    className={rowClassName}
                    aria-disabled="true"
                  >
                    {rowContent}
                  </div>
                ) : (
                  <Link key={event.id} href={href} className={rowClassName}>
                    {rowContent}
                  </Link>
                );
              })}

              {pastEvents.length > 0 && upcomingEvents.length > 0 && (
                <div className="bg-jackals-inset/50 px-5 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                    Earlier this month
                  </p>
                </div>
              )}

              {pastEvents.map((event) => {
                const eventDate = new Date(event.startDate);
                const { timeLabel } = formatEventDateTime(
                  event.startDate,
                  event.endDate,
                );
                const userStatus = attendanceByEventId[event.id] ?? "UNANSWERED";
                const isCancelled = event.cancelled === true;

                const row = (
                  <>
                    <SessionDateBlock date={eventDate} locked={isCancelled} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm",
                          isCancelled
                            ? "text-zinc-500 line-through decoration-zinc-600"
                            : "text-zinc-400",
                        )}
                      >
                        {format(eventDate, "EEEE d MMMM")}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden />
                        {timeLabel}
                      </p>
                      {isCancelled ? (
                        <div className="mt-1">
                          <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-500">
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
                      <Clock className="h-3 w-3" />
                      {isCancelled ? "Cancelled" : "Past"}
                    </span>
                  </>
                );

                return isCancelled ? (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 px-5 py-3 opacity-60"
                    aria-disabled="true"
                  >
                    {row}
                  </div>
                ) : (
                  <Link
                    key={event.id}
                    href={`/training/session/${event.id}`}
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

export function NoTrainingTeamAssigned({ squads }: { squads: TrainingTeam[] }) {
  return (
    <PageContainer>
      <PageHeader
        title="Training"
        description="Your squad sessions will appear here once you're assigned to a team."
      />

      <AnimateIn>
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 bg-jackals-red/5 px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
              <Users className="h-7 w-7" />
            </div>
            <CardTitle>No team assigned yet</CardTitle>
            <CardDescription className="mx-auto mt-2 max-w-md">
              An admin needs to assign you to a squad before you can sign up for
              training. Each squad trains once a week:
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
