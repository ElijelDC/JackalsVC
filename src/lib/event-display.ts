import { format } from "date-fns";
import { CLUB_TIMEZONE, formatInClubTime } from "@/lib/datetime-form";
import { isSkillsClinicEvent } from "@/lib/events-config";

export const EVENT_TYPE_STYLES: Record<
  string,
  { badge: string; dot: string; cell: string; accent: string }
> = {
  TRAINING: {
    badge: "bg-blue-500/15 text-blue-400",
    dot: "bg-blue-400",
    cell: "bg-blue-500/10",
    accent: "border-blue-400/50",
  },
  FUN: {
    badge: "bg-yellow-500/15 text-yellow-300",
    dot: "bg-yellow-400",
    cell: "bg-yellow-500/10",
    accent: "border-yellow-400/50",
  },
  TOURNAMENT: {
    badge: "bg-jackals-red/15 text-jackals-red-light",
    dot: "bg-jackals-red-light",
    cell: "bg-jackals-red/10",
    accent: "border-jackals-red/50",
  },
  SKILLS_CLINIC: {
    badge: "bg-blue-500/15 text-blue-300",
    dot: "bg-blue-400",
    cell: "bg-blue-500/10",
    accent: "border-blue-400/50",
  },
  SOCIAL: {
    badge: "bg-purple-500/15 text-purple-400",
    dot: "bg-purple-400",
    cell: "bg-purple-500/10",
    accent: "border-purple-400/50",
  },
  MEETING: {
    badge: "bg-green-500/15 text-green-400",
    dot: "bg-green-400",
    cell: "bg-green-500/10",
    accent: "border-green-400/50",
  },
};

export const DEFAULT_EVENT_TYPE_STYLE = {
  badge: "bg-zinc-500/15 text-zinc-400",
  dot: "bg-zinc-400",
  cell: "bg-white/5",
  accent: "border-white/20",
};

export function getEventTypeStyle(type: string) {
  return EVENT_TYPE_STYLES[type] ?? DEFAULT_EVENT_TYPE_STYLE;
}

export function getEventDisplayStyle(event: {
  type: string;
  title?: string;
  description?: string | null;
  sessionDescription?: string | null;
}) {
  return EVENT_TYPE_STYLES[getEventDisplayStyleKey(event)] ?? DEFAULT_EVENT_TYPE_STYLE;
}

export function getEventDisplayStyleKey(event: {
  type: string;
  title?: string;
  description?: string | null;
  sessionDescription?: string | null;
}): string {
  if (event.type === "SKILLS_CLINIC") {
    return "SKILLS_CLINIC";
  }

  if (event.type === "SOCIAL") {
    if (
      event.title &&
      isSkillsClinicEvent({
        title: event.title,
        description: event.sessionDescription ?? event.description ?? null,
      })
    ) {
      return "SKILLS_CLINIC";
    }
    return "SOCIAL";
  }

  return event.type;
}

function formatStartTimeLabel(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? "am" : "pm";
  return `${hour12}:${minutes.toString().padStart(2, "0")}${ampm} start`;
}

export function formatEventDateTime(
  startDate: string,
  endDate: string | null,
  options?: { eventType?: string; timeZone?: string },
) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  const isTournament = options?.eventType === "TOURNAMENT";
  const useClubTime =
    options?.timeZone === CLUB_TIMEZONE || options?.timeZone === "club";

  if (useClubTime) {
    const dateLabel = formatInClubTime(start, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formatClock = (value: Date) =>
      formatInClubTime(value, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });

    return {
      dateLabel,
      timeLabel: isTournament
        ? formatClock(start)
        : end
          ? `${formatClock(start)} – ${formatClock(end)}`
          : formatClock(start),
    };
  }

  return {
    dateLabel: format(start, "EEEE, d MMMM yyyy"),
    timeLabel: isTournament
      ? formatStartTimeLabel(start)
      : end
        ? `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`
        : format(start, "HH:mm"),
  };
}

export function eventDetailPath(eventId: string) {
  return `/calendar/${eventId}`;
}
