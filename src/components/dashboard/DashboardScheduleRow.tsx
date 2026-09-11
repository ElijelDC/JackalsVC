"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  getDashboardResponseDisplay,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function DatePill({
  date,
  tone,
}: {
  date: Date;
  tone: "urgent" | "attending" | "declined" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-md border text-center",
        tone === "urgent" && "border-amber-400/35 bg-amber-500/15",
        tone === "attending" && "border-green-500/30 bg-green-500/15",
        tone === "declined" && "border-rose-500/25 bg-rose-500/10",
        tone === "neutral" && "border-white/10 bg-black/25",
      )}
    >
      <span
        className={cn(
          "text-[9px] font-semibold uppercase leading-none tracking-wide",
          tone === "urgent" && "text-amber-300/80",
          tone === "attending" && "text-green-400/80",
          tone === "declined" && "text-rose-300/80",
          tone === "neutral" && "text-zinc-500",
        )}
      >
        {format(date, "MMM")}
      </span>
      <span
        className={cn(
          "mt-0.5 text-sm font-bold leading-none",
          tone === "urgent" && "text-amber-100",
          tone === "attending" && "text-green-100",
          tone === "declined" && "text-rose-100",
          tone === "neutral" && "text-white",
        )}
      >
        {format(date, "d")}
      </span>
    </div>
  );
}

const rowBaseClassName =
  "group flex h-full min-h-0 items-center gap-2.5 px-3 transition-colors sm:gap-3 sm:px-3.5";

export function DashboardEventRow({
  href,
  date,
  title,
  meta,
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
      className={cn(rowBaseClassName, "hover:bg-white/[0.03]")}
    >
      <DatePill date={date} tone="neutral" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white sm:text-sm">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
          {meta}
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
}: {
  href: string;
  date: Date;
  title: string;
  meta: string;
  status: TrainingAttendanceStatus;
  eventDate: Date;
  dense?: boolean;
}) {
  const display = getDashboardResponseDisplay(status, eventDate);
  const tone = display.needsUrgentResponse
    ? "urgent"
    : status === "ATTENDING"
      ? "attending"
      : status === "NOT_ATTENDING"
        ? "declined"
        : "neutral";

  return (
    <Link
      href={href}
      className={cn(
        rowBaseClassName,
        tone === "urgent" &&
          "bg-amber-500/[0.12] hover:bg-amber-500/[0.18] ring-1 ring-inset ring-amber-400/25",
        tone === "attending" &&
          "bg-green-500/[0.08] hover:bg-green-500/[0.14] ring-1 ring-inset ring-green-500/20",
        tone === "declined" && "hover:bg-white/[0.03]",
        tone === "neutral" && "hover:bg-white/[0.03]",
      )}
    >
      <DatePill date={date} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white sm:text-sm">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
          {meta}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
          display.badgeClassName,
        )}
      >
        {display.needsUrgentResponse
          ? "Reply"
          : status === "ATTENDING"
            ? "Yes"
            : status === "NOT_ATTENDING"
              ? "No"
              : "Open"}
      </span>
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
