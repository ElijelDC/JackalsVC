"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/FormMessage";
import { TrainingResponsesLockedNotice } from "@/components/training/TrainingResponsesLocked";
import {
  canRespondToTrainingSession,
  getTrainingResponseOpensOn,
  TRAINING_ATTENDANCE_BADGE_STYLES,
  TRAINING_ATTENDANCE_SHORT_LABELS,
  type TrainingAttendanceResponseStatus,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { apiDelete, apiPost } from "@/lib/client-api";
import type { CoachResponseGate } from "@/lib/coach-session-coverage-config";
import { cn } from "@/lib/utils";

const RESPONSE_OPTIONS: TrainingAttendanceResponseStatus[] = [
  "ATTENDING",
  "NOT_ATTENDING",
];

const OPTION_STYLES: Record<TrainingAttendanceResponseStatus, string> = {
  ATTENDING:
    "border-green-500/50 bg-green-500/15 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.12)]",
  NOT_ATTENDING:
    "border-rose-400/55 bg-rose-500/20 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.2)]",
};

export function TrainingAttendancePicker({
  eventId,
  matchId,
  sessionStartDate,
  initialStatus = "UNANSWERED",
  disabled = false,
  layout = "row",
  showLockedNotice = true,
  itemLabel = "session",
  coachMode = false,
  coachResponseGate = null,
  className,
}: {
  eventId?: string;
  matchId?: string;
  sessionStartDate: string | Date;
  initialStatus?: TrainingAttendanceStatus;
  disabled?: boolean;
  layout?: "row" | "stack";
  showLockedNotice?: boolean;
  itemLabel?: string;
  coachMode?: boolean;
  coachResponseGate?: CoachResponseGate | null;
  className?: string;
}) {
  const targetId = matchId ?? eventId;

  return (
    <TrainingAttendancePickerInner
      key={`${targetId}-${initialStatus}-${coachResponseGate?.kind ?? "open"}`}
      eventId={eventId}
      matchId={matchId}
      sessionStartDate={sessionStartDate}
      initialStatus={initialStatus}
      disabled={disabled}
      layout={layout}
      showLockedNotice={showLockedNotice}
      itemLabel={itemLabel}
      coachMode={coachMode}
      coachResponseGate={coachResponseGate}
      className={className}
    />
  );
}

function TrainingAttendancePickerInner({
  eventId,
  matchId,
  sessionStartDate,
  initialStatus = "UNANSWERED",
  disabled = false,
  layout = "row",
  showLockedNotice = true,
  itemLabel = "session",
  coachMode = false,
  coachResponseGate = null,
  className,
}: {
  eventId?: string;
  matchId?: string;
  sessionStartDate: string | Date;
  initialStatus?: TrainingAttendanceStatus;
  disabled?: boolean;
  layout?: "row" | "stack";
  showLockedNotice?: boolean;
  itemLabel?: string;
  coachMode?: boolean;
  coachResponseGate?: CoachResponseGate | null;
  className?: string;
}) {
  const router = useRouter();
  const sessionDate = new Date(sessionStartDate);
  const canRespond = canRespondToTrainingSession(sessionDate);
  const responseOpensOn = getTrainingResponseOpensOn(sessionDate);
  const coverLocked = coachResponseGate !== null;
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState<TrainingAttendanceResponseStatus | null>(
    null,
  );
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isMatch = Boolean(matchId);
  const targetId = matchId ?? eventId;

  const setAttendance = async (next: TrainingAttendanceResponseStatus) => {
    if (disabled || !canRespond || coverLocked || !targetId || next === status) {
      return;
    }

    setLoading(next);
    setMessage(null);

    const result = await apiPost(
      isMatch ? "/api/match-signups" : "/api/event-signups",
      isMatch ? { matchId: targetId, status: next } : { eventId: targetId, status: next },
      "Failed to update response",
    );

    setLoading(null);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setStatus(next);
    router.refresh();
  };

  const clearAttendance = async () => {
    if (
      disabled ||
      coverLocked ||
      status === "UNANSWERED" ||
      loading !== null ||
      clearing ||
      !targetId
    ) {
      return;
    }

    setClearing(true);
    setMessage(null);

    const result = await apiDelete(
      isMatch
        ? `/api/match-signups?matchId=${targetId}`
        : `/api/event-signups?eventId=${targetId}`,
      "Failed to clear response",
    );

    setClearing(false);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setStatus("UNANSWERED");
    router.refresh();
  };

  const pickerDisabled = disabled || !canRespond || coverLocked;
  const responseOptions = RESPONSE_OPTIONS;
  const showClear = status !== "UNANSWERED" && !coverLocked;

  return (
    <div className={cn("space-y-2", className)}>
      <AlertBanner message={message} />
      {!canRespond && status === "UNANSWERED" && showLockedNotice && (
        <TrainingResponsesLockedNotice opensOn={responseOpensOn} itemLabel={itemLabel} />
      )}
      {canRespond && coachResponseGate?.kind === "waiting_for_head" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-100">
            Waiting for head coach
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-100/70">
            {coachResponseGate.headCoachName} responds first. After they decline,
            you can cover this session.
          </p>
        </div>
      )}
      {canRespond && coachResponseGate?.kind === "head_accepted" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-medium text-amber-100">
            Head coach accepted
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-100/70">
            {coachResponseGate.headCoachName} is covering this session — no cover
            needed.
          </p>
        </div>
      )}
      <div
        className={cn(
          "flex gap-2",
          layout === "stack" ? "flex-col" : "flex-wrap",
          (!canRespond || coverLocked) && "pointer-events-none opacity-40",
        )}
        role="group"
        aria-label="Your attendance response"
      >
        {responseOptions.map((option) => {
          const isActive = status === option;
          const isLoading = loading === option;

          return (
            <Button
              key={option}
              type="button"
              variant={isActive ? "primary" : "outline"}
              size="sm"
              disabled={pickerDisabled || loading !== null || clearing}
              onClick={() => void setAttendance(option)}
              className={cn(
                "min-w-[7.5rem] flex-1 border transition-all duration-300",
                layout === "row" && "sm:flex-none",
                isActive
                  ? OPTION_STYLES[option]
                  : "border-white/15 bg-transparent text-zinc-400 hover:border-white/25 hover:text-white",
              )}
            >
              {isLoading ? "..." : TRAINING_ATTENDANCE_SHORT_LABELS[option]}
            </Button>
          );
        })}
      </div>
      {status === "UNANSWERED" ? (
        canRespond &&
        !coverLocked && (
          <p className="text-xs text-zinc-500">
            {coachMode
              ? "Choose Attend or Can't attend — your squad will see whether you're coaching."
              : "Choose Attend or Can't attend — teammates will see you as unanswered until you respond."}
          </p>
        )
      ) : showClear ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void clearAttendance()}
          disabled={disabled || loading !== null || clearing}
          className={cn(
            "gap-2 border-white/20 bg-white/[0.05] text-zinc-200 hover:border-white/30 hover:bg-white/[0.1] hover:text-white",
            layout === "stack"
              ? "h-11 w-full text-sm"
              : "min-h-10 w-full text-sm sm:w-auto",
          )}
        >
          <RotateCcw
            className={cn(
              "h-4 w-4 shrink-0 text-zinc-400",
              clearing && "animate-spin",
            )}
            aria-hidden
          />
          {clearing ? "Clearing..." : "Clear response (back to unanswered)"}
        </Button>
      ) : null}
    </div>
  );
}

export function TrainingAttendanceStatusBadge({
  status,
  className,
}: {
  status: TrainingAttendanceStatus;
  className?: string;
}) {
  const styles = TRAINING_ATTENDANCE_BADGE_STYLES;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles[status],
        className,
      )}
    >
      {TRAINING_ATTENDANCE_SHORT_LABELS[status]}
    </span>
  );
}
