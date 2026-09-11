"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import {
  getDashboardResponseDisplay,
  getDashboardStatusInlineClass,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { cn } from "@/lib/utils";

function DatePill({ date, dense = false }: { date: Date; dense?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-md border border-white/10 bg-black/20 text-center",
        dense ? "h-9 w-8 sm:h-10 sm:w-10" : "h-10 w-10",
      )}
    >
      <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span
        className={cn(
          "font-bold leading-tight text-white",
          dense ? "text-xs sm:text-sm" : "text-sm",
        )}
      >
        {format(date, "d")}
      </span>
    </div>
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
        "group flex items-start transition-colors hover:bg-white/[0.03]",
        dense
          ? "gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5"
          : "gap-3 px-3 py-3.5 sm:px-4",
      )}
    >
      <DatePill date={date} dense={dense} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "font-medium leading-snug text-white",
            dense ? "line-clamp-2 text-[13px] sm:text-sm" : "text-sm",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-relaxed text-zinc-400",
            dense ? "line-clamp-2 text-[11px] sm:text-xs" : "text-xs",
          )}
        >
          {meta}
        </p>
      </div>
      <ChevronRight
        className={cn(
          "mt-1 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400",
          dense ? "hidden h-3.5 w-3.5 sm:block" : "h-4 w-4",
        )}
      />
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
  const display = getDashboardResponseDisplay(status, eventDate);

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start transition-colors hover:bg-white/[0.03]",
        dense
          ? "gap-2 px-2.5 py-2.5 sm:gap-3 sm:px-4 sm:py-3.5"
          : "gap-3 px-3 py-3.5 sm:px-4",
      )}
    >
      <DatePill date={date} dense={dense} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p
          className={cn(
            "font-medium leading-snug text-white",
            dense ? "line-clamp-2 text-[13px] sm:text-sm" : "text-sm",
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5 leading-relaxed text-zinc-400",
            dense ? "line-clamp-2 text-[11px] sm:text-xs" : "text-xs",
          )}
        >
          <span>{meta}</span>
          <span className={getDashboardStatusInlineClass(display, status)}>
            {" · "}
            {display.label}
          </span>
        </p>
      </div>
      <ChevronRight
        className={cn(
          "mt-1 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400",
          dense ? "hidden h-3.5 w-3.5 sm:block" : "h-4 w-4",
        )}
      />
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
