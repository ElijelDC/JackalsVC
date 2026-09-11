"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  getDashboardResponseDisplay,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-black/20 text-center sm:h-11 sm:w-10">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="text-sm font-bold leading-none text-white sm:text-base">
        {format(date, "d")}
      </span>
    </div>
  );
}

function StatusChip({
  status,
  eventDate,
}: {
  status: TrainingAttendanceStatus;
  eventDate: Date;
}) {
  const display = getDashboardResponseDisplay(status, eventDate);
  const shortLabel = display.needsUrgentResponse
    ? "Reply"
    : status === "ATTENDING"
      ? "Yes"
      : status === "NOT_ATTENDING"
        ? "No"
        : "Open";

  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        display.needsUrgentResponse && "bg-amber-500/15 text-amber-300",
        status === "ATTENDING" && "bg-green-500/15 text-green-400",
        status === "NOT_ATTENDING" && "bg-rose-500/15 text-rose-300",
        !display.needsUrgentResponse &&
          status !== "ATTENDING" &&
          status !== "NOT_ATTENDING" &&
          "bg-white/5 text-zinc-500",
      )}
    >
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{display.label}</span>
    </span>
  );
}

export function DashboardEventRow({
  href,
  date,
  title,
  meta,
  dense = false,
}: {
  href: string;
  date: Date;
  title: string;
  meta: string;
  dense?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 transition-colors hover:bg-white/[0.03]",
        dense ? "px-3 py-2.5" : "px-4 py-3.5",
      )}
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500 sm:text-xs">
          {dense ? format(date, "EEE · HH:mm") : meta}
        </p>
      </div>
    </Link>
  );
}

export function DashboardScheduleRow({
  href,
  date,
  title,
  meta,
  status,
  eventDate,
  dense = false,
}: {
  href: string;
  date: Date;
  title: string;
  meta: string;
  status: TrainingAttendanceStatus;
  eventDate: Date;
  dense?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-2.5 transition-colors hover:bg-white/[0.03]",
        dense ? "px-3 py-2.5" : "gap-3 px-4 py-3.5",
      )}
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-zinc-500 sm:text-xs">
          {dense ? format(date, "EEE · HH:mm") : meta}
        </p>
      </div>
      <StatusChip status={status} eventDate={eventDate} />
    </Link>
  );
}

export function buildScheduleMeta(
  date: Date,
  {
    teamName,
    showTeam,
    location,
  }: {
    teamName?: string | null;
    showTeam?: boolean;
    location?: string | null;
  },
) {
  const parts: string[] = [];
  if (showTeam && teamName) parts.push(teamName);
  parts.push(format(date, "EEE HH:mm"));
  if (location) parts.push(location);
  return parts.join(" · ");
}
