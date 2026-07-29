"use client";

import { format } from "date-fns";
import {
  coachTrainingPayItemLabel,
  groupCoachPaySessionsByTeam,
  type CoachMonthPayrollBreakdown,
  type CoachTrainingPayItem,
} from "@/lib/coach-payments-config";
import { formatEuroFee, cn } from "@/lib/utils";

function sessionRowClass(item: CoachTrainingPayItem) {
  if (item.cancelled) return "text-zinc-500";
  if (!item.payable && !item.expected) return "text-rose-300";
  if (item.expected) return "text-sky-300";
  return "text-zinc-300";
}

function SessionRows({
  sessions,
  now,
}: {
  sessions: CoachTrainingPayItem[];
  now: Date;
}) {
  return (
    <ul className="divide-y divide-white/5">
      {sessions.map((item) => (
        <li
          key={item.eventId}
          className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="text-sm text-white">
              {format(new Date(item.startDate), "EEE d MMM · HH:mm")}
            </p>
            {item.location ? (
              <p className="mt-0.5 truncate text-xs text-zinc-600">
                {item.location}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-right">
            <p
              className={cn(
                "text-sm font-medium",
                item.payable || item.expected ? "text-white" : "text-zinc-500",
              )}
            >
              {formatEuroFee(item.amount)}
            </p>
            <p className={cn("mt-0.5 text-[11px]", sessionRowClass(item))}>
              {coachTrainingPayItemLabel(item, now)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CoachPaymentSessionBreakdown({
  breakdown,
  ratePerSession,
  className,
}: {
  breakdown: CoachMonthPayrollBreakdown;
  ratePerSession: number;
  className?: string;
}) {
  const now = new Date();
  const groups = groupCoachPaySessionsByTeam(breakdown.sessions);
  const multiTeam = groups.length > 1;
  const payableAmount = breakdown.billableCount * ratePerSession;
  const expectedAmount = breakdown.expectedCount * ratePerSession;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-xl font-bold text-white">{breakdown.billableCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            Payable
          </p>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-3 py-3 text-center">
          <p className="text-xl font-bold text-sky-200">
            {breakdown.expectedCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-sky-300/70">
            Expected
          </p>
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-3 text-center">
          <p className="text-xl font-bold text-rose-300">
            {breakdown.cantAttendCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-rose-300/70">
            Can&apos;t attend
          </p>
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        {breakdown.billableCount > 0 && (
          <>
            {breakdown.billableCount} payable × {formatEuroFee(ratePerSession)}
            {payableAmount > 0 ? ` = ${formatEuroFee(payableAmount)}` : ""}
          </>
        )}
        {breakdown.billableCount > 0 && breakdown.expectedCount > 0 && " · "}
        {breakdown.expectedCount > 0 && (
          <>
            {breakdown.expectedCount} upcoming
            {expectedAmount > 0
              ? ` (${formatEuroFee(expectedAmount)} if attended)`
              : ""}
          </>
        )}
        {breakdown.billableCount === 0 && breakdown.expectedCount === 0 && (
          <>No payable trainings yet this month</>
        )}
        {breakdown.cantAttendCount > 0 &&
          ` · ${breakdown.cantAttendCount} deducted for can't attend`}
        {breakdown.cancelledCount > 0 &&
          ` · ${breakdown.cancelledCount} cancelled`}
      </p>

      {breakdown.sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">No training sessions scheduled.</p>
      ) : multiTeam ? (
        <div className="space-y-2">
          {groups.map((group) => {
            const groupPayableAmount = group.billableCount * ratePerSession;
            return (
              <details
                key={group.key}
                className="group/team overflow-hidden rounded-lg border border-white/10 bg-white/[0.02] open:bg-white/[0.03]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {group.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {group.billableCount} payable
                      {group.expectedCount > 0
                        ? ` · ${group.expectedCount} expected`
                        : ""}
                      {group.cantAttendCount > 0
                        ? ` · ${group.cantAttendCount} can't attend`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className="text-sm font-semibold text-white">
                      {formatEuroFee(groupPayableAmount)}
                    </p>
                    <span
                      aria-hidden
                      className="text-zinc-500 transition-transform group-open/team:rotate-180"
                    >
                      ▾
                    </span>
                  </div>
                </summary>
                <div className="border-t border-white/10 px-3.5 py-2">
                  <SessionRows sessions={group.sessions} now={now} />
                </div>
              </details>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3.5 py-2">
          <SessionRows sessions={breakdown.sessions} now={now} />
        </div>
      )}
    </div>
  );
}
