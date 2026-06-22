"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageShell";
import { SquadRosterGroup } from "@/components/training/SquadRosterGroup";
import { TrainingAttendancePicker } from "@/components/training/TrainingAttendancePicker";
import { TrainingResponsesLockedNotice } from "@/components/training/TrainingResponsesLocked";
import {
  formatMatchTitle,
  formatMatchVenueLabel,
} from "@/lib/match-config";
import type { MatchDetailData } from "@/lib/match-attendance";
import {
  canRespondToTrainingSession,
  getTrainingResponseOpensOn,
  TRAINING_ATTENDANCE_LABELS,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

export function MatchDetailView({
  detail,
  canAccessAttendance,
  monthParam,
}: {
  detail: MatchDetailData;
  canAccessAttendance: boolean;
  monthParam: string;
}) {
  const { match, team } = detail;
  const matchDate = new Date(match.matchStart);
  const warmUpDate = new Date(match.warmUpTime);
  const isHome = match.venue === "HOME";
  const past = matchDate < new Date();
  const canRespond = canRespondToTrainingSession(matchDate);
  const responseOpensOn = getTrainingResponseOpensOn(matchDate);

  return (
    <PageContainer>
      <AnimateIn immediate>
        <Link
          href={`/matches?month=${monthParam}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {team.name}
        </Link>
      </AnimateIn>

      <AnimateIn delay={50}>
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <Users className="h-3.5 w-3.5" />
              {team.name}
            </div>
          </div>
          <div className="px-6 py-6">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                isHome
                  ? "border border-green-500/30 bg-green-500/10 text-green-300"
                  : "border border-sky-500/30 bg-sky-500/10 text-sky-300",
              )}
            >
              {formatMatchVenueLabel(match.venue)}
            </span>
            <h1 className="font-display mt-4 text-2xl font-semibold text-white">
              {formatMatchTitle(match.opponentName, match.venue)}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {format(matchDate, "EEEE d MMMM yyyy")}
            </p>
          </div>
        </div>
      </AnimateIn>

      <AnimateIn delay={75}>
        <Card className="mb-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-jackals-red-light" />
            Match details
          </CardTitle>

          <dl className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Opponent
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {match.opponentName}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Location
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {match.location}
                </dd>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Warm-up time
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">
                    {format(warmUpDate, "HH:mm")}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Match start
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">
                    {format(matchDate, "HH:mm")}
                  </dd>
                </div>
              </div>
            </div>
          </dl>

          {match.notes && (
            <CardDescription className="mt-4 whitespace-pre-wrap border-t border-white/10 pt-4">
              {match.notes}
            </CardDescription>
          )}
        </Card>
      </AnimateIn>

      <div className="grid gap-6 lg:grid-cols-5">
        <AnimateIn delay={100} className="lg:col-span-2">
          <Card>
            <CardTitle className="text-base">Your response</CardTitle>
            <CardDescription className="mt-2">
              {past
                ? "This match has already started."
                : !canAccessAttendance
                  ? "Active membership is required to respond."
                  : !canRespond
                    ? `Responses open ${TRAINING_RESPONSE_OPENS_DAYS} days before the match — from ${format(responseOpensOn, "d MMMM")}.`
                    : "Let coaches and teammates know if you're playing."}
            </CardDescription>

            {!past && canAccessAttendance && (
              <div className="mt-6 space-y-4">
                {!canRespond && (
                  <TrainingResponsesLockedNotice
                    opensOn={responseOpensOn}
                    itemLabel="match"
                  />
                )}
                <TrainingAttendancePicker
                  matchId={match.id}
                  sessionStartDate={match.matchStart}
                  initialStatus={detail.userStatus}
                  layout="stack"
                  showLockedNotice={false}
                  itemLabel="match"
                />
              </div>
            )}

            {!past && !canAccessAttendance && (
              <Link
                href="/membership"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-jackals-red-light hover:text-jackals-red"
              >
                Get membership to respond
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </Card>

          <Card className="mt-4">
            <CardTitle className="text-base">Squad summary</CardTitle>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-3">
                <p className="text-2xl font-bold text-green-400">
                  {detail.counts.attending}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                  Attending
                </p>
              </div>
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-3">
                <p className="text-2xl font-bold text-rose-300">
                  {detail.counts.notAttending}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-rose-300/70">
                  Can&apos;t attend
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-3">
                <p className="text-2xl font-bold text-amber-300">
                  {detail.counts.unanswered}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                  Unanswered
                </p>
              </div>
            </div>
          </Card>
        </AnimateIn>

        <AnimateIn delay={150} className="lg:col-span-3">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-jackals-red-light" />
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                  Squad responses
                </p>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                Only players on {team.name} can see this list.
              </p>
            </div>

            <div className="space-y-6 p-5">
              <SquadRosterGroup
                title={TRAINING_ATTENDANCE_LABELS.ATTENDING}
                members={detail.roster.attending}
                tone="green"
              />
              <SquadRosterGroup
                title={TRAINING_ATTENDANCE_LABELS.NOT_ATTENDING}
                members={detail.roster.notAttending}
                tone="rose"
              />
              <SquadRosterGroup
                title={TRAINING_ATTENDANCE_LABELS.UNANSWERED}
                members={detail.roster.unanswered}
                tone="amber"
              />
            </div>
          </Card>
        </AnimateIn>
      </div>
    </PageContainer>
  );
}
