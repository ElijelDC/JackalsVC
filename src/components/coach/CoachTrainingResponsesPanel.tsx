"use client";

import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { Bell, CheckCircle2, ChevronRight, Swords, Users } from "lucide-react";
import { CoachReminderConfirmModal } from "@/components/coach/CoachReminderConfirmModal";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CoachUnansweredItem } from "@/lib/coach-unanswered-config";
import { getCoachUnansweredItemUrl } from "@/lib/coach-unanswered-config";
import { withDashboardReturn } from "@/lib/dashboard-return";
import { useCoachReminderNotify } from "@/hooks/useCoachReminderNotify";
import { cn } from "@/lib/utils";

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
    kind: item.kind,
    targetId: item.id,
    initialStatus: item.reminder ?? {
      canSend: true,
      lastSentAt: null,
      nextAvailableAt: null,
    },
    sendLabel: "Notify",
  });

  const Icon = item.kind === "match" ? Swords : Users;
  const headline =
    item.kind === "match" ? item.title : formatCoachItemDate(item.startDate);

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
          </div>
          <div className="flex shrink-0 flex-col items-end justify-between self-stretch">
            <div className="flex flex-col items-end gap-0.5">
              <Button
                type="button"
                size="sm"
                variant={onCooldown ? "outline" : "primary"}
                onClick={() => setConfirmOpen(true)}
                disabled={loading || onCooldown}
                title={onCooldown ? cooldownHint ?? undefined : undefined}
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs",
                  onCooldown &&
                    "cursor-not-allowed border-white/10 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-zinc-500",
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
            <Link
              href={withDashboardReturn(getCoachUnansweredItemUrl(item))}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-white"
            >
              View
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <CoachReminderConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        loading={loading}
        onCooldown={onCooldown}
        playerCount={item.players.length}
        itemLabel={itemLabel}
        onConfirm={() => {
          setConfirmOpen(false);
          void notifyPlayers();
        }}
      />
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
