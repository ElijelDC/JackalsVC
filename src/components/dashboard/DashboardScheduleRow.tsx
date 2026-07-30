"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import {
  getDashboardResponseDisplay,
  getDashboardStatusInlineClass,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center border border-white/10 bg-jackals-surface text-center">
      <span className="text-[10px] font-medium uppercase leading-none text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="text-sm font-bold leading-tight text-white">{format(date, "d")}</span>
    </div>
  );
}

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
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 px-3 py-3.5 transition-colors hover:bg-white/[0.03] sm:px-4"
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-medium leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{meta}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
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
}) {
  const display = getDashboardResponseDisplay(status, eventDate);

  return (
    <Link
      href={href}
      className="group flex items-start gap-3 px-3 py-3.5 transition-colors hover:bg-white/[0.03] sm:px-4"
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="font-medium leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
          {meta}
          <span className={getDashboardStatusInlineClass(display, status)}>
            {" · "}
            {display.label}
          </span>
        </p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
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
