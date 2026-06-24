"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type {
  CoachReminderStatus,
  CoachUnansweredItemKind,
} from "@/lib/coach-unanswered-config";
import { apiPost } from "@/lib/client-api";

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
  const [status, setStatus] = useState(initialStatus);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const itemLabel = kind === "match" ? "match" : "training session";

  const notifyPlayers = async () => {
    if (!status.canSend || loading) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await apiPost<{
        deliveredCount: number;
        loggedCount: number;
        cooldown: CoachReminderStatus;
      }>("/api/coach/notify-unanswered", { kind, id: targetId });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setStatus(result.data.cooldown);

      if (result.data.deliveredCount > 0) {
        setMessage(
          `Reminder sent to ${result.data.deliveredCount} player${result.data.deliveredCount === 1 ? "" : "s"}.`,
        );
      } else if (result.data.loggedCount > 0) {
        setMessage(
          `Email not configured — ${result.data.loggedCount} reminder${result.data.loggedCount === 1 ? "" : "s"} logged to the server console.`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reminders");
    } finally {
      setLoading(false);
    }
  };

  const cooldownLabel =
    !status.canSend && status.nextAvailableAt
      ? `Available ${formatDistanceToNow(new Date(status.nextAvailableAt), { addSuffix: true })}`
      : null;

  return (
    <>
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-jackals-red-light" />
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                Squad responses
              </p>
            </div>
          </div>

          {showReminder && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              disabled={!status.canSend || loading}
              className="shrink-0 gap-2 border-amber-500/30 bg-amber-500/10 text-amber-100 hover:border-amber-500/50 hover:bg-amber-500/15 hover:text-amber-50"
            >
              <Bell className="h-3.5 w-3.5" />
              Send reminder
            </Button>
          )}
        </div>

        {showReminder && (cooldownLabel || message || error) && (
          <div className="mt-3 space-y-1">
            {cooldownLabel && (
              <p className="text-xs text-zinc-500">{cooldownLabel}</p>
            )}
            {message && <p className="text-xs text-green-300">{message}</p>}
            {error && <p className="text-xs text-rose-300">{error}</p>}
          </div>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        title="Send reminder?"
        description={
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            Send an email reminder to {unansweredCount} unanswered player
            {unansweredCount === 1 ? "" : "s"} asking them to respond to this{" "}
            {itemLabel}?
          </p>
        }
      >
        <Button
          type="button"
          onClick={() => {
            setConfirmOpen(false);
            void notifyPlayers();
          }}
          disabled={loading || !status.canSend}
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
