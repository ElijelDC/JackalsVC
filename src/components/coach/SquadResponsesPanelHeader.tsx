"use client";

import { Bell, CheckCircle2, Users } from "lucide-react";
import { CoachReminderConfirmModal } from "@/components/coach/CoachReminderConfirmModal";
import { Button } from "@/components/ui/Button";
import type {
  CoachReminderStatus,
  CoachUnansweredItemKind,
} from "@/lib/coach-unanswered-config";
import { useCoachReminderNotify } from "@/hooks/useCoachReminderNotify";
import { cn } from "@/lib/utils";

export function SquadResponsesPanelHeader({
  kind,
  targetId,
  initialStatus,
  unansweredCount,
  showReminder,
}: {
  kind: CoachUnansweredItemKind;
  targetId: string;
  initialStatus: CoachReminderStatus;
  unansweredCount: number;
  showReminder: boolean;
}) {
  const {
    confirmOpen,
    setConfirmOpen,
    loading,
    notifyPlayers,
    onCooldown,
    cooldownHint,
    buttonLabel,
    inlineNote,
    error,
    successMessage,
    itemLabel,
  } = useCoachReminderNotify({
    kind,
    targetId,
    initialStatus,
    sendLabel: "Remind",
  });

  return (
    <>
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 pt-0.5">
            <Users className="h-4 w-4 shrink-0 text-jackals-red-light" />
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">
              Player responses
            </p>
          </div>

          {showReminder ? (
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setConfirmOpen(true)}
                disabled={loading || onCooldown}
                title={onCooldown ? cooldownHint ?? undefined : undefined}
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs",
                  onCooldown
                    ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-500"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-100 hover:border-amber-500/50 hover:bg-amber-500/15 hover:text-amber-50",
                )}
              >
                {onCooldown ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Bell className="h-3.5 w-3.5" />
                )}
                {buttonLabel}
              </Button>
              {inlineNote ? (
                <p
                  className={cn(
                    "max-w-[9rem] truncate text-right text-[10px] leading-tight",
                    error
                      ? "text-rose-300"
                      : successMessage
                        ? "text-green-300"
                        : "text-zinc-500",
                  )}
                  title={inlineNote}
                >
                  {inlineNote}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <CoachReminderConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        loading={loading}
        onCooldown={onCooldown}
        playerCount={unansweredCount}
        itemLabel={itemLabel}
        onConfirm={() => {
          setConfirmOpen(false);
          void notifyPlayers();
        }}
      />
    </>
  );
}
