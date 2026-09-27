"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { apiPost } from "@/lib/client-api";
import type { CoachCoverageReminderPreview } from "@/lib/coach-coverage-reminders-config";
import { getCoachReminderCooldownHint } from "@/lib/coach-reminder-ui";
import { cn } from "@/lib/utils";

export function OverseerRemindCoachesButton({
  eventId,
  initialPreview,
}: {
  eventId: string;
  initialPreview: CoachCoverageReminderPreview;
}) {
  const [preview, setPreview] = useState(initialPreview);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionable = preview.phase === "head" || preview.phase === "cover";
  const onCooldown = actionable && !preview.cooldown.canSend;
  const cooldownHint = getCoachReminderCooldownHint(preview.cooldown);
  const canClick = actionable && preview.canSend && !loading;

  const buttonLabel = loading
    ? "Sending..."
    : onCooldown
      ? "Sent"
      : preview.buttonLabel;

  const inlineNote =
    error ??
    successMessage ??
    (onCooldown ? cooldownHint : actionable ? preview.description : null);

  const sendReminder = async () => {
    if (!canClick) return;
    setLoading(true);
    setSuccessMessage(null);
    setError(null);
    try {
      const result = await apiPost<{
        message: string;
        preview: CoachCoverageReminderPreview;
        notifiedCount: number;
        recipientNames: string[];
      }>("/api/coach/remind-coach-coverage", { eventId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPreview(result.data.preview);
      setSuccessMessage(result.data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reminder");
    } finally {
      setLoading(false);
    }
  };

  if (!actionable) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <p className="text-xs font-medium text-zinc-300">{preview.buttonLabel}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
          {preview.description}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              Coach coverage
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-400">
              {preview.description}
            </p>
            {preview.recipientNames.length > 0 ? (
              <p className="mt-1 truncate text-[11px] text-zinc-500">
                To: {preview.recipientNames.join(", ")}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={!canClick}
            title={onCooldown ? (cooldownHint ?? undefined) : undefined}
            className={cn(
              "h-8 shrink-0 gap-1.5 px-2.5 text-xs",
              onCooldown || !preview.canSend
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
        </div>
        {inlineNote ? (
          <p
            className={cn(
              "mt-1.5 text-[10px] leading-tight",
              error
                ? "text-rose-300"
                : successMessage
                  ? "text-green-300"
                  : "text-zinc-500",
            )}
          >
            {inlineNote}
          </p>
        ) : null}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        title="Remind coaches?"
        description={
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            {preview.phase === "head" ? (
              <>
                Email{" "}
                <strong className="text-zinc-200">
                  {preview.headCoachName ?? "the head coach"}
                </strong>{" "}
                asking them to accept or decline this session first?
              </>
            ) : (
              <>
                Email{" "}
                <strong className="text-zinc-200">
                  {preview.recipientNames.length} cover coach
                  {preview.recipientNames.length === 1 ? "" : "es"}
                </strong>{" "}
                ({preview.recipientNames.join(", ")}) asking them to cover?
              </>
            )}
          </p>
        }
      >
        <Button
          type="button"
          onClick={() => {
            setConfirmOpen(false);
            void sendReminder();
          }}
          disabled={!canClick}
          className="h-12 w-full gap-2 text-base"
        >
          <Bell className="h-4 w-4" />
          {loading ? "Sending..." : "Send reminder"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmOpen(false)}
          disabled={loading}
          className="h-12 w-full text-base"
        >
          Cancel
        </Button>
      </Modal>
    </>
  );
}
