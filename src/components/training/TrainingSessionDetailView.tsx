"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  UserPlus,
} from "lucide-react";
import { TrainingAttendancePicker } from "@/components/training/TrainingAttendancePicker";
import { SquadSummaryCard } from "@/components/training/SquadSummaryCard";
import { CoachTrainingInvitePanel } from "@/components/training/CoachTrainingInvitePanel";
import { SquadResponsesPanelHeader } from "@/components/coach/SquadResponsesPanelHeader";
import { SquadRosterGroup } from "@/components/training/SquadRosterGroup";
import { TrainingResponsesLockedNotice } from "@/components/training/TrainingResponsesLocked";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DashboardBackLink } from "@/components/dashboard/DashboardBackLink";
import { PageContainer } from "@/components/layout/PageShell";
import { apiDelete } from "@/lib/client-api";
import { CLUB_TIMEZONE } from "@/lib/datetime-form";
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

type MobileTab = "you" | "squad" | "guests";

export function TrainingSessionDetailView({
  detail,
  canAccessAttendance,
  attendanceBlockReason = null,
  isPaygTraining = false,
  monthParam,
  backHref,
  backLabel,
}: {
  detail: TrainingSessionDetailData;
  canAccessAttendance: boolean;
  attendanceBlockReason?: AttendanceBlockReason | null;
  isPaygTraining?: boolean;
  monthParam: string;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [removingGuestId, setRemovingGuestId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("you");
  const guests = detail.guests ?? [];
  const guestCount = detail.counts.guests ?? guests.length;

  // Clear any leftover lock class from the previous no-scroll experiment.
  useEffect(() => {
    document.documentElement.classList.remove("session-detail-lock");
  }, []);

  const removeGuest = async (guestSignupId: string) => {
    setRemovingGuestId(guestSignupId);
    const result = await apiDelete(
      `/api/coach/training/invites/signups/${guestSignupId}`,
      "Could not remove guest",
    );
    setRemovingGuestId(null);
    if (result.ok) {
      router.refresh();
    }
  };

  const eventDate = new Date(detail.event.startDate);
  const cancelled = detail.event.cancelled;
  const { timeLabel } = formatEventDateTime(
    detail.event.startDate,
    detail.event.endDate,
    { timeZone: CLUB_TIMEZONE },
  );
  const past = eventDate < new Date();
  const canRespond = !cancelled && canRespondToTrainingSession(eventDate);
  const responseOpensOn = getTrainingResponseOpensOn(eventDate);
  const listBackHref = backHref ?? `/training?month=${monthParam}`;
  const listBackLabel = backLabel ?? detail.team.name;

  const responseDescription = cancelled
    ? "This session was cancelled. Attendance responses are closed."
    : past
      ? "This session has already started."
      : !canAccessAttendance
        ? attendanceBlockReason === "overdue"
          ? "Your membership payment is overdue. Pay outstanding instalments to respond to training."
          : isPaygTraining
            ? "Pay Per Training is temporarily unavailable."
            : "Active membership is required to respond."
        : !canRespond
          ? `Responses open ${TRAINING_RESPONSE_OPENS_DAYS} days before — from ${format(responseOpensOn, "d MMMM")}.`
          : detail.isCoachUser
            ? detail.coachResponseGate?.kind === "waiting_for_head"
              ? `Waiting for ${detail.coachResponseGate.headCoachName} (head coach) to respond first.`
              : detail.coachResponseGate?.kind === "head_accepted"
                ? `${detail.coachResponseGate.headCoachName} accepted — no cover needed.`
                : "Let your squad know if you're attending."
            : "Let coaches and teammates know if you're coming.";

  const responseCard = (
    <Card>
      <CardTitle className="text-base">Your response</CardTitle>
      <CardDescription className="mt-1.5 text-sm leading-snug">
        {responseDescription}
      </CardDescription>

      {!past && !cancelled && canAccessAttendance && (
        <div className="mt-4 space-y-3">
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
            isPaygTraining={isPaygTraining}
          />
        </div>
      )}

      {!past && !cancelled && !canAccessAttendance && (
        <Link
          href="/membership"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-jackals-red-light hover:text-jackals-red"
        >
          {attendanceBlockReason === "overdue"
            ? "View payment schedule"
            : "Get membership to respond"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      <div className="mt-4 lg:mt-5">
        <SquadSummaryCard
          counts={detail.counts}
          coaches={detail.coaches}
          isCoachUser={detail.isCoachUser}
          compact
        />
      </div>
    </Card>
  );

  const squadCard = (
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

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-5">
        <SquadRosterGroup
          title={TRAINING_ATTENDANCE_LABELS.ATTENDING}
          members={detail.roster.attending}
          tone="green"
          dense
        />
        <SquadRosterGroup
          title={TRAINING_ATTENDANCE_LABELS.NOT_ATTENDING}
          members={detail.roster.notAttending}
          tone="rose"
          dense
        />
        <SquadRosterGroup
          title={TRAINING_ATTENDANCE_LABELS.UNANSWERED}
          members={detail.roster.unanswered}
          tone="amber"
          dense
        />
      </div>
    </Card>
  );

  const guestsSection = (
    <div className="space-y-4">
      <Card>
        <CardTitle className="text-base">Guests</CardTitle>
        <CardDescription className="mt-1 text-sm">
          Approved invitees for this session.
        </CardDescription>
        <div className="mt-4">
          <SquadRosterGroup
            title="Attending guests"
            members={guests}
            tone="green"
            dense
            onRemoveGuest={
              detail.isCoachUser ? (id) => void removeGuest(id) : undefined
            }
            removingGuestId={removingGuestId}
          />
        </div>
      </Card>
      {detail.isCoachUser && !cancelled ? (
        <CoachTrainingInvitePanel eventId={detail.event.id} compact />
      ) : null}
    </div>
  );

  const mobileTabs: Array<{ id: MobileTab; label: string; icon: typeof Users }> =
    [
      { id: "you", label: "You", icon: CalendarDays },
      { id: "squad", label: "Squad", icon: Users },
      ...(detail.isCoachUser || guests.length > 0
        ? ([
            {
              id: "guests" as const,
              label: guestCount > 0 ? `Guests (${guestCount})` : "Guests",
              icon: UserPlus,
            },
          ] as const)
        : []),
    ];

  return (
    <PageContainer className="py-4 sm:py-12">
      <AnimateIn immediate>
        <DashboardBackLink href={listBackHref} label={listBackLabel} />
      </AnimateIn>

      <AnimateIn delay={50}>
        <div className="mb-4 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface sm:mb-8">
          <div className="border-b border-jackals-red/20 px-4 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              <CalendarDays className="h-3.5 w-3.5" />
              {detail.team.name}
            </div>
          </div>
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1
                className={cn(
                  "font-display text-xl font-semibold sm:text-2xl",
                  cancelled
                    ? "text-zinc-400 line-through decoration-zinc-600"
                    : "text-white",
                )}
              >
                <span className="sm:hidden">{format(eventDate, "EEE d MMM")}</span>
                <span className="hidden sm:inline">
                  {format(eventDate, "EEEE d MMMM")}
                </span>
              </h1>
              {cancelled ? (
                <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                  Cancelled
                </Badge>
              ) : null}
            </div>
            {!cancelled ? (
              <p className="mt-1.5 text-sm text-zinc-400">{detail.event.title}</p>
            ) : (
              <p className="mt-1.5 text-sm text-zinc-500">
                This session has been cancelled by your coach.
              </p>
            )}

            <div className="mt-3 grid gap-2 sm:mt-5 sm:grid-cols-2 sm:gap-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="h-4 w-4 shrink-0 text-jackals-red-light" />
                {timeLabel}
              </div>
              {detail.event.location ? (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <MapPin className="h-4 w-4 shrink-0 text-jackals-red-light" />
                  {detail.event.location}
                </div>
              ) : null}
            </div>

            {detail.event.description ? (
              <p className="mt-3 hidden text-sm leading-relaxed text-zinc-500 sm:mt-4 sm:block">
                {detail.event.description}
              </p>
            ) : null}
          </div>
        </div>
      </AnimateIn>

      {/* Mobile tabs */}
      <div className="mb-3 flex gap-1 rounded-lg border border-white/10 bg-jackals-inset p-1 lg:hidden">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileTab(tab.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2.5 text-xs font-semibold transition",
                active
                  ? "bg-jackals-red/20 text-jackals-red-light"
                  : "text-zinc-400 active:bg-white/5",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="lg:hidden">
        {mobileTab === "you"
          ? responseCard
          : mobileTab === "squad"
            ? squadCard
            : guestsSection}
      </div>

      {/* Desktop */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-5">
        <div className="lg:col-span-2">
          {responseCard}
          {detail.isCoachUser && !cancelled ? (
            <div className="mt-4">
              <CoachTrainingInvitePanel eventId={detail.event.id} />
            </div>
          ) : null}
          {(detail.isCoachUser || guests.length > 0) && (
            <div className="mt-4">{guestsSection}</div>
          )}
        </div>
        <div className="lg:col-span-3">{squadCard}</div>
      </div>
    </PageContainer>
  );
}
