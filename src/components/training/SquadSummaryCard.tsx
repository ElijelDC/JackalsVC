"use client";

import type { ReactNode } from "react";
import { TeamMemberAvatar } from "@/components/teams/TeamMemberCard";
import { Card, CardTitle } from "@/components/ui/Card";
import {
  TRAINING_ATTENDANCE_BADGE_STYLES,
  TRAINING_ATTENDANCE_LABELS,
  getCoachesVisibleToUser,
  sortCoachesForDisplay,
  type TrainingRosterGroups,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function SummaryStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "green" | "rose" | "amber";
}) {
  const toneClasses = {
    green: {
      box: "border-green-500/20 bg-green-500/5",
      value: "text-green-400",
    },
    rose: {
      box: "border-rose-500/20 bg-rose-500/5",
      value: "text-rose-300",
    },
    amber: {
      box: "border-amber-500/20 bg-amber-500/5",
      value: "text-amber-300",
    },
  }[tone];

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center justify-center rounded-lg border px-2 py-3",
        toneClasses.box,
      )}
    >
      <p className={cn("text-2xl font-bold tabular-nums", toneClasses.value)}>
        {value}
      </p>
      <p className="mt-1 px-0.5 text-center text-[11px] font-medium leading-snug text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function CoachAttendanceList({
  coaches,
  showStatusBadges,
}: {
  coaches: TrainingRosterGroups;
  showStatusBadges: boolean;
}) {
  const allCoaches = sortCoachesForDisplay([
    ...coaches.attending,
    ...coaches.notAttending,
    ...coaches.unanswered,
  ]);

  if (allCoaches.length === 0) return null;

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="mb-3 text-xs font-medium text-zinc-500">
        {allCoaches.length === 1 ? "Coach" : "Coaches"}
      </p>
      <ul className="space-y-2.5">
        {allCoaches.map((coach) => (
          <li key={coach.userId} className="flex items-center gap-2.5">
            <TeamMemberAvatar
              name={coach.name}
              className={cn(
                "h-8 w-8 shrink-0",
                coach.isCurrentUser &&
                  "ring-2 ring-jackals-red ring-offset-2 ring-offset-jackals-surface",
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "truncate text-sm",
                  coach.isCurrentUser
                    ? "font-medium text-jackals-red-light"
                    : "text-zinc-300",
                )}
                title={coach.isCurrentUser ? `${coach.name} (you)` : coach.name}
              >
                {coach.name}
                {coach.isCurrentUser ? (
                  <span className="font-normal text-zinc-500"> · you</span>
                ) : null}
              </p>
              {coach.isHeadCoach ? (
                <p className="text-[11px] font-medium tracking-wide text-amber-300/90">
                  Head coach
                </p>
              ) : null}
            </div>
            {showStatusBadges ? (
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                  TRAINING_ATTENDANCE_BADGE_STYLES[coach.status],
                )}
              >
                {TRAINING_ATTENDANCE_LABELS[coach.status]}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SquadSummaryCard({
  counts,
  coaches,
  isCoachUser,
  children,
}: {
  counts: {
    attending: number;
    notAttending: number;
    unanswered: number;
  };
  coaches: TrainingRosterGroups;
  isCoachUser: boolean;
  children?: ReactNode;
}) {
  const visibleCoaches = getCoachesVisibleToUser(coaches, isCoachUser);
  return (
    <Card>
      <CardTitle className="text-base">Player summary</CardTitle>

      {children ? <div className="mt-4">{children}</div> : null}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <SummaryStat
          value={counts.attending}
          label={TRAINING_ATTENDANCE_LABELS.ATTENDING}
          tone="green"
        />
        <SummaryStat
          value={counts.notAttending}
          label={TRAINING_ATTENDANCE_LABELS.NOT_ATTENDING}
          tone="rose"
        />
        <SummaryStat
          value={counts.unanswered}
          label={TRAINING_ATTENDANCE_LABELS.UNANSWERED}
          tone="amber"
        />
      </div>

      <CoachAttendanceList
        coaches={visibleCoaches}
        showStatusBadges={isCoachUser}
      />
    </Card>
  );
}
