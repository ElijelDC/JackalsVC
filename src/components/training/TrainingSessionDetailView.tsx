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

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => {
      if (mq.matches) root.classList.add("session-detail-lock");
      else root.classList.remove("session-detail-lock");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      root.classList.remove("session-detail-lock");
      mq.removeEventListener("change", apply);
    };
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
    <Card className="h-full min-h-0 overflow-y-auto overscroll-contain">
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

      <div className="mt-4">
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
    <Card className="flex h-full min-h-0 flex-col overflow-hidden p-0">
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

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
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

  const guestsCard = (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <Card className="min-h-0 flex-1 overflow-hidden p-4">
        <CardTitle className="text-base">Guests</CardTitle>
        <CardDescription className="mt-1 text-sm">
          Approved invitees for this session.
        </CardDescription>
        <div className="mt-3 min-h-0 max-h-[40%] overflow-y-auto overscroll-contain sm:max-h-none">
          <SquadRosterGroup
            title="Attending guests"
            members={detail.guests}
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
        <div className="min-h-0 flex-[1.2] overflow-y-auto overscroll-contain">
          <CoachTrainingInvitePanel eventId={detail.event.id} compact />
        </div>
      ) : null}
    </div>
  );

  const mobileTabs: Array<{ id: MobileTab; label: string; icon: typeof Users }> =
    [
      { id: "you", label: "You", icon: CalendarDays },
      { id: "squad", label: "Squad", icon: Users },
      ...(detail.isCoachUser
        ? ([
            {
              id: "guests" as const,
              label:
                detail.counts.guests > 0
                  ? `Guests (${detail.counts.guests})`
                  : "Guests",
              icon: UserPlus,
            },
          ] as const)
        : detail.guests.length > 0
          ? ([
              {
                id: "guests" as const,
                label: `Guests (${detail.counts.guests})`,
                icon: UserPlus,
              },
            ] as const)
          : []),
    ];

  return (
    <>
      {/* Mobile: viewport-locked tabbed layout (no page scroll) */}
      <div className="fixed inset-x-0 bottom-0 top-[4.25rem] z-40 flex flex-col overflow-hidden bg-background lg:hidden">
        <div className="shrink-0 border-b border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface px-3 py-2.5">
          <DashboardBackLink
            href={listBackHref}
            label={listBackLabel}
            className="mb-1.5"
          />
          <div className="flex flex-wrap items-center gap-2">
            <h1
              className={cn(
                "font-display text-lg font-semibold leading-tight",
                cancelled
                  ? "text-zinc-400 line-through decoration-zinc-600"
                  : "text-white",
              )}
            >
              {format(eventDate, "EEE d MMM")}
            </h1>
            {cancelled ? (
              <Badge className="border-zinc-500/30 bg-zinc-500/10 text-zinc-400">
                Cancelled
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-400">
            {detail.event.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-300">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 text-jackals-red-light" />
              {timeLabel}
            </span>
            {detail.event.location ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0 text-jackals-red-light" />
                <span className="truncate">{detail.event.location}</span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-white/10 bg-jackals-inset px-2 py-1.5">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active = mobileTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition",
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

        <div className="min-h-0 flex-1 overflow-hidden p-2">
          {mobileTab === "you"
            ? responseCard
            : mobileTab === "squad"
              ? squadCard
              : guestsCard}
        </div>
      </div>

      {/* Desktop: original multi-column layout */}
      <PageContainer className="hidden lg:block">
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
            {responseCard}
            {detail.isCoachUser && !cancelled ? (
              <div className="mt-4">
                <CoachTrainingInvitePanel eventId={detail.event.id} />
              </div>
            ) : null}
            {(detail.isCoachUser || detail.guests.length > 0) && (
              <Card className="mt-4">
                <CardTitle className="text-base">Guests</CardTitle>
                <CardDescription className="mt-2">
                  Approved invitees for this session.
                </CardDescription>
                <div className="mt-4">
                  <SquadRosterGroup
                    title="Attending guests"
                    members={detail.guests}
                    tone="green"
                    onRemoveGuest={
                      detail.isCoachUser
                        ? (id) => void removeGuest(id)
                        : undefined
                    }
                    removingGuestId={removingGuestId}
                  />
                </div>
              </Card>
            )}
          </AnimateIn>

          <AnimateIn delay={150} className="lg:col-span-3">
            {squadCard}
          </AnimateIn>
        </div>
      </PageContainer>
    </>
  );
}
