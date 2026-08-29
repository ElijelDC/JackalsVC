"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import { TrainingAttendancePicker } from "@/components/training/TrainingAttendancePicker";
import { SquadSummaryCard } from "@/components/training/SquadSummaryCard";
import { SquadResponsesPanelHeader } from "@/components/coach/SquadResponsesPanelHeader";
import { SquadRosterGroup } from "@/components/training/SquadRosterGroup";
import { TrainingResponsesLockedNotice } from "@/components/training/TrainingResponsesLocked";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { PageContainer } from "@/components/layout/PageShell";
import { formatEventDateTime } from "@/lib/event-display";
import type { TrainingSessionDetailData } from "@/lib/training-attendance-config";
import {
  canRespondToTrainingSession,
  getTrainingResponseOpensOn,
  TRAINING_ATTENDANCE_LABELS,
  TRAINING_RESPONSE_OPENS_DAYS,
} from "@/lib/training-attendance-config";

import type { AttendanceBlockReason } from "@/lib/membership";
import { cn } from "@/lib/utils";

export function TrainingSessionDetailView({
  detail,
  canAccessAttendance,
  attendanceBlockReason = null,
  monthParam,
  backHref,
  backLabel,
}: {
  detail: TrainingSessionDetailData;
  canAccessAttendance: boolean;
  attendanceBlockReason?: AttendanceBlockReason | null;
  monthParam: string;
  backHref?: string;
  backLabel?: string;
}) {
  const eventDate = new Date(detail.event.startDate);
  const cancelled = detail.event.cancelled;
  const { timeLabel } = formatEventDateTime(
    detail.event.startDate,
    detail.event.endDate,
  );
  const past = eventDate < new Date();
  const canRespond =
    !cancelled && canRespondToTrainingSession(eventDate);
  const responseOpensOn = getTrainingResponseOpensOn(eventDate);
  const listBackHref = backHref ?? `/training?month=${monthParam}`;
  const listBackLabel = backLabel ?? detail.team.name;

  return (
    <PageContainer>
      <AnimateIn immediate>
        <DashboardBackLink href={listBackHref} label={listBackLabel} />
      </AnimateIn>

      <AnimateIn delay={50}>
        <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
          <div className="border-b border-jackals-red/20 px-6 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <CalendarDays className="h-3.5 w-3.5" />
              {detail.team.name}
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className={cn(
                  "font-display text-2xl font-semibold",
                  cancelled
                    ? "text-zinc-400 line-through decoration-zinc-600"
                    : "text-white",
                )}
              >
                {format(eventDate, "EEEE d MMMM")}
              </h1>
              {cancelled && (
                <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                  Cancelled
                </Badge>
              )}
            </div>
            {!cancelled && (
              <p className="mt-2 text-sm text-zinc-400">{detail.event.title}</p>
            )}
            {cancelled && (
              <p className="mt-2 text-sm text-zinc-500">
                This session has been cancelled by your coach.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="h-4 w-4 shrink-0 text-jackals-red-light" />
                {timeLabel}
              </div>
              {detail.event.location && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  {detail.event.location}
                </div>
              )}
            </div>

            {detail.event.description && (
              <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                {detail.event.description}
              </p>
            )}
          </div>
        </div>
      </AnimateIn>

      <div className="grid gap-6 lg:grid-cols-5">
        <AnimateIn delay={100} className="lg:col-span-2">
          <Card>
            <CardTitle className="text-base">Your response</CardTitle>
            <CardDescription className="mt-2">
              {cancelled
                ? "This session was cancelled. Attendance responses are closed."
                : past
                ? "This session has already started."
                : !canAccessAttendance
                  ? attendanceBlockReason === "overdue"
                    ? "Your membership payment is overdue. Pay outstanding instalments to respond to training."
                    : "Active membership is required to respond."
                  : !canRespond
                    ? `Responses open ${TRAINING_RESPONSE_OPENS_DAYS} days before the session — from ${format(responseOpensOn, "d MMMM")}.`
                    : detail.isCoachUser
                      ? detail.coachResponseGate?.kind === "waiting_for_head"
                        ? `Waiting for ${detail.coachResponseGate.headCoachName} (head coach) to respond first.`
                        : detail.coachResponseGate?.kind === "head_accepted"
                          ? `${detail.coachResponseGate.headCoachName} accepted — no cover needed.`
                          : "Let your squad know if you're attending this session."
                      : "Let coaches and teammates know if you're coming."}
            </CardDescription>

            {!past && !cancelled && canAccessAttendance && (
              <div className="mt-6 space-y-4">
                {!canRespond && (
                  <TrainingResponsesLockedNotice opensOn={responseOpensOn} />
                )}
                <TrainingAttendancePicker
                  eventId={detail.event.id}
                  sessionStartDate={detail.event.startDate}
                  initialStatus={detail.userStatus}
                  layout="stack"
                  showLockedNotice={false}
                  coachMode={detail.isCoachUser}
                  coachResponseGate={detail.coachResponseGate}
                />
              </div>
            )}

            {!past && !cancelled && !canAccessAttendance && (
              <Link
                href="/membership"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-jackals-red-light hover:text-jackals-red"
              >
                {attendanceBlockReason === "overdue"
                  ? "View payment schedule"
                  : "Get membership to respond"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </Card>

          <div className="mt-4">
            <SquadSummaryCard
              counts={detail.counts}
              coaches={detail.coaches}
              isCoachUser={detail.isCoachUser}
            />
          </div>
        </AnimateIn>

        <AnimateIn delay={150} className="lg:col-span-3">
          <Card className="overflow-hidden p-0">
            <SquadResponsesPanelHeader
              kind="training"
              targetId={detail.event.id}
              initialStatus={
                detail.coachReminder ?? {
                  canSend: true,
                  lastSentAt: null,
                  nextAvailableAt: null,
                }
              }
              unansweredCount={detail.roster.unanswered.length}
              showReminder={
                detail.isCoachUser &&
                Boolean(detail.coachReminder) &&
                detail.roster.unanswered.length > 0
              }
            />

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
