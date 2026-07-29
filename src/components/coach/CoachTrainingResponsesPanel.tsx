"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Bell, ChevronRight, Swords, Users } from "lucide-react";
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

const PREVIEW_LIMIT = 2;

function formatCoachItemDate(isoDate: string) {
  return format(new Date(isoDate), "EEE d MMM · HH:mm");
}

function TeamPill({ name }: { name: string }) {
  return (
    <span className="inline-flex max-w-[9rem] truncate rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-zinc-300">
      {name}
    </span>
  );
}

function PendingResponseRow({
  item,
  showTeam,
}: {
  item: CoachUnansweredItem;
  showTeam: boolean;
}) {
  const [reminderStatus, setReminderStatus] = useState<CoachReminderStatus>(
    item.reminder ?? { canSend: true, lastSentAt: null, nextAvailableAt: null },
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const Icon = item.kind === "match" ? Swords : Users;
  const itemLabel = item.kind === "match" ? "match" : "training session";
  const headline =
    item.kind === "match" ? item.title : formatCoachItemDate(item.startDate);

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
      <div className="px-3 py-3 sm:px-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-amber-500/15 text-amber-200 clip-slash-reverse">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium leading-snug text-white">{headline}</p>
              {showTeam && item.teamName ? (
                <TeamPill name={item.teamName} />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {item.kind === "match" ? formatCoachItemDate(item.startDate) : "Training"}
              {item.location ? ` · ${item.location}` : ""}
            </p>
            <p className="mt-1 text-xs text-amber-200">
              {item.players.length} player{item.players.length === 1 ? "" : "s"}{" "}
              awaiting response
            </p>
            {(message || error) && (
              <p
                className={`mt-1.5 text-xs ${error ? "text-rose-300" : "text-green-300"}`}
              >
                {error ?? message}
              </p>
            )}
            {cooldownLabel ? (
              <p className="mt-1 text-[11px] text-zinc-500">{cooldownLabel}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={loading || !reminderStatus.canSend}
              className="gap-1.5"
            >
              <Bell className="h-3.5 w-3.5" />
              {loading ? "Sending..." : "Notify"}
            </Button>
            <Link
              href={getCoachUnansweredItemUrl(item)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-white"
            >
              View
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

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

function panelSummary(pending: CoachUnansweredItem[]) {
  const sessions = pending.filter((item) => item.kind === "training").length;
  const matches = pending.filter((item) => item.kind === "match").length;
  const players = pending.reduce((sum, item) => sum + item.players.length, 0);
  const parts: string[] = [];

  if (sessions > 0) {
    parts.push(`${sessions} session${sessions === 1 ? "" : "s"}`);
  }
  if (matches > 0) {
    parts.push(`${matches} match${matches === 1 ? "" : "es"}`);
  }

  const eventLabel = parts.join(" · ") || "No pending items";
  return `${eventLabel} · ${players} player${players === 1 ? "" : "s"} awaiting response`;
}

export function CoachTrainingResponsesPanel({
  pending,
  showTeam = false,
}: {
  pending: CoachUnansweredItem[];
  showTeam?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (pending.length === 0) {
    return null;
  }

  const visible = expanded ? pending : pending.slice(0, PREVIEW_LIMIT);
  const hiddenCount = pending.length - visible.length;

  return (
    <DashboardSection
      title="Responses needed"
      description={panelSummary(pending)}
    >
      <Card className="overflow-hidden border-amber-500/20 p-0">
        <div className="divide-y divide-white/10">
          {visible.map((item) => (
            <PendingResponseRow
              key={`${item.kind}-${item.id}`}
              item={item}
              showTeam={showTeam}
            />
          ))}
        </div>
        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex w-full items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-amber-200"
          >
            +{hiddenCount} more
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </Card>
    </DashboardSection>
  );
}
