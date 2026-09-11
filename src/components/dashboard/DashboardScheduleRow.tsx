"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  getDashboardResponseDisplay,
  getDashboardStatusInlineClass,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-black/25 text-center">
      <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="mt-0.5 text-sm font-bold leading-none text-white">
        {format(date, "d")}
      </span>
    </div>
  );
}

const rowClassName =
  "group flex h-full min-h-0 items-center gap-2.5 px-3 transition-colors hover:bg-white/[0.03] sm:gap-3 sm:px-3.5";

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
  /** @deprecated Rows always fill their tile slot. */
  dense?: boolean;
}) {
  return (
    <Link href={href} className={rowClassName}>
      <DatePill date={date} />
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
  /** @deprecated Rows always fill their tile slot. */
  dense?: boolean;
}) {
  const display = getDashboardResponseDisplay(status, eventDate);

  return (
    <Link href={href} className={rowClassName}>
      <DatePill date={date} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white sm:text-sm">
          {title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-zinc-400 sm:text-xs">
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
