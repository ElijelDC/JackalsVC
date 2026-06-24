"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Bell, ExternalLink, Swords, Users } from "lucide-react";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type {
  CoachReminderStatus,
  CoachUnansweredItem,
} from "@/lib/coach-unanswered-config";
import { getCoachUnansweredItemUrl } from "@/lib/coach-unanswered-config";
import { apiPost } from "@/lib/client-api";

export type { CoachUnansweredItem };

function formatCoachItemDate(isoDate: string) {
  return format(new Date(isoDate), "EEE d MMM · HH:mm");
}

function PendingResponseCard({
  item,
}: {
  item: CoachUnansweredItem;
}) {
  const [reminderStatus, setReminderStatus] = useState<CoachReminderStatus>(
    item.reminder ?? { canSend: true, lastSentAt: null, nextAvailableAt: null },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const Icon = item.kind === "match" ? Swords : Users;
  const viewLabel = item.kind === "match" ? "View match" : "View session";
  const itemLabel = item.kind === "match" ? "match" : "training session";

  const notifyPlayers = async () => {
    if (!reminderStatus.canSend || loading) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const result = await apiPost<{
        notifiedCount: number;
        deliveredCount: number;
        loggedCount: number;
        cooldown: CoachReminderStatus;
      }>("/api/coach/notify-unanswered", {
        kind: item.kind,
        id: item.id,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setReminderStatus(result.data.cooldown);

      if (result.data.deliveredCount > 0) {
        setMessage(
          `Reminder sent to ${result.data.deliveredCount} player${result.data.deliveredCount === 1 ? "" : "s"}.`,
        );
      } else if (result.data.loggedCount > 0) {
        setMessage(
          `Email is not configured — ${result.data.loggedCount} reminder${result.data.loggedCount === 1 ? "" : "s"} logged to the server console.`,
        );
      } else {
        setMessage("No players needed a reminder.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reminders");
    } finally {
      setLoading(false);
    }
  };

  const cooldownLabel =
    !reminderStatus.canSend && reminderStatus.nextAvailableAt
      ? `Available ${formatDistanceToNow(new Date(reminderStatus.nextAvailableAt), { addSuffix: true })}`
      : null;

  return (
    <>
      <Card className="overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-transparent p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-amber-500/15 text-amber-200 clip-slash-reverse">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                {item.kind === "match" ? "Match" : "Training"}
              </p>
              <p className="font-medium text-white">
                {item.kind === "match" ? item.title : formatCoachItemDate(item.startDate)}
              </p>
              {item.kind === "match" ? (
                <p className="mt-0.5 text-sm text-zinc-400">
                  {formatCoachItemDate(item.startDate)}
                </p>
              ) : null}
              {item.location && (
                <p className="mt-0.5 text-sm text-zinc-400">{item.location}</p>
              )}
              <p className="mt-2 text-sm text-amber-200">
                {item.players.length} player
                {item.players.length === 1 ? "" : "s"} still need to respond
              </p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {item.players.slice(0, 2).map((player) => (
              <li
                key={player.userId}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300"
              >
                {player.name}
              </li>
            ))}
            {item.players.length > 2 && (
              <li className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-amber-200">
                +{item.players.length - 2} more
              </li>
            )}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={loading || !reminderStatus.canSend}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {loading ? "Sending..." : "Notify players"}
          </Button>
          {cooldownLabel && (
            <p className="text-xs text-zinc-500">{cooldownLabel}</p>
          )}
          <Link
            href={getCoachUnansweredItemUrl(item)}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            {viewLabel}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {(message || error) && (
        <div className="border-t border-white/10 px-5 py-3 sm:px-6">
          {message && <p className="text-sm text-green-300">{message}</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
        </div>
      )}
      </Card>

      <Modal
        open={confirmOpen}
        onClose={() => !loading && setConfirmOpen(false)}
        title="Send reminder?"
        description={
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            Send an email reminder to {item.players.length} unanswered player
            {item.players.length === 1 ? "" : "s"} asking them to respond to this{" "}
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
          disabled={loading || !reminderStatus.canSend}
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

export function CoachTrainingResponsesPanel({
  pending,
}: {
  pending: CoachUnansweredItem[];
}) {
  if (pending.length === 0) {
    return null;
  }

  return (
    <DashboardSection
      title="Responses needed"
      description="Players who haven't confirmed for training or matches this week."
    >
      <div className="space-y-4">
        {pending.map((item) => (
          <PendingResponseCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </DashboardSection>
  );
}
