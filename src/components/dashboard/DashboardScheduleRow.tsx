"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  getDashboardResponseDisplay,
  getDashboardStatusInlineClass,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function DateBlock({
  date,
  tone,
}: {
  date: Date;
  tone: "urgent" | "attending" | "declined" | "neutral";
}) {
  return (
    <div
      className={cn(
        "flex h-9 w-8 shrink-0 flex-col items-center justify-center rounded text-center sm:h-10 sm:w-9",
        tone === "urgent" && "bg-amber-500/20",
        tone === "attending" && "bg-green-500/20",
        tone === "declined" && "bg-rose-500/15",
        tone === "neutral" && "bg-black/30",
      )}
    >
      <span
        className={cn(
          "text-[8px] font-semibold uppercase leading-none tracking-wide sm:text-[9px]",
          tone === "urgent" && "text-amber-300/90",
          tone === "attending" && "text-green-400/90",
          tone === "declined" && "text-rose-300/90",
          tone === "neutral" && "text-zinc-500",
        )}
      >
        {format(date, "MMM")}
      </span>
      <span
        className={cn(
          "mt-0.5 text-[13px] font-bold leading-none sm:text-sm",
          tone === "urgent" && "text-amber-50",
          tone === "attending" && "text-green-50",
          tone === "declined" && "text-rose-50",
          tone === "neutral" && "text-white",
        )}
      >
        {format(date, "d")}
      </span>
    </div>
  );
}

const rowBaseClassName =
  "group relative flex h-full min-h-0 items-center gap-2 px-2.5 transition-colors sm:gap-2.5 sm:px-3";

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
    <Link href={href} className={cn(rowBaseClassName, "hover:bg-white/[0.03]")}>
      <DateBlock date={date} tone="neutral" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-[12px] font-medium leading-snug text-white sm:text-[13px]">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 break-words text-[10px] leading-snug text-zinc-400 sm:text-[11px]">
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
        tone === "urgent" && "bg-amber-500/[0.12] hover:bg-amber-500/[0.18]",
        tone === "attending" && "bg-green-500/[0.08] hover:bg-green-500/[0.14]",
        tone === "declined" && "hover:bg-white/[0.03]",
        tone === "neutral" && "hover:bg-white/[0.03]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-0.5",
          tone === "urgent" && "bg-amber-400",
          tone === "attending" && "bg-green-400",
          tone === "declined" && "bg-rose-400/70",
          tone === "neutral" && "bg-transparent",
        )}
      />
      <DateBlock date={date} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-[12px] font-medium leading-snug text-white sm:text-[13px]">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-2 break-words text-[10px] leading-snug text-zinc-400 sm:text-[11px]">
          <span>{meta}</span>
          <span className={getDashboardStatusInlineClass(display, status)}>
            {" · "}
            {display.label}
          </span>
        </p>
      </div>
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
