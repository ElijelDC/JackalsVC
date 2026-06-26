import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { getEventTypeStyle } from "@/lib/event-display";
import { formatRecurrenceLabel } from "@/lib/training-utils";
import type { TrainingSessionCardData } from "@/types/training-session";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function sessionRecurrenceLabel(session: TrainingSessionCardData) {
  if (session.recurring) {
    return formatRecurrenceLabel(session);
  }
  if (session.sessionDate) {
    return format(new Date(session.sessionDate), "EEEE, d MMMM yyyy");
  }
  return undefined;
}

export function SessionCard({
  session,
  detailBasePath,
  showRecurrence,
  className,
  accentType,
}: {
  session: TrainingSessionCardData;
  detailBasePath: string;
  showRecurrence?: string;
  className?: string;
  accentType?: "FUN";
}) {
  const recurrence =
    showRecurrence ?? sessionRecurrenceLabel(session);
  const accentStyle = accentType ? getEventTypeStyle(accentType) : null;
  const href = session.nextEventId
    ? `/calendar/${session.nextEventId}`
    : `${detailBasePath}/${session.id}`;

  return (
    <Link
      href={href}
      className="group block h-full"
    >
      <Card
        className={cn(
          "motion-hover-lift h-full overflow-hidden group-hover:border-jackals-red/40 group-hover:bg-jackals-surface",
          accentStyle && "p-0",
          className,
        )}
      >
        {accentStyle && (
          <div className={cn("h-1 w-full", accentStyle.dot)} aria-hidden />
        )}
        <div className={cn(accentStyle && "p-6")}>
          <div className="mb-3 flex items-start justify-between gap-2">
            {accentStyle ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  accentStyle.badge,
                )}
              >
                Fun session
              </span>
            ) : (
              <CardTitle>{session.title}</CardTitle>
            )}
            <Badge>{session.level}</Badge>
          </div>
          {accentStyle && <CardTitle className="mb-3">{session.title}</CardTitle>}

          <div className="space-y-2 text-sm text-zinc-400">
            {recurrence && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
                {recurrence}
              </div>
            )}
            {session.nextEventDate && (
              <div className="flex items-center gap-2 text-jackals-red-light/80">
                <CalendarDays className="h-4 w-4 shrink-0 text-jackals-red-light/60" />
                Upcoming: {format(new Date(session.nextEventDate), "EEE, d MMM")}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
              {session.startTime} – {session.endTime}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
              {session.location}
            </div>
            {session.coach && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-zinc-500" />
                Coach: {session.coach}
              </div>
            )}
          </div>

          {session.description && (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
              {session.description}
            </p>
          )}

          <p className="mt-4 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
            View details →
          </p>
        </div>
      </Card>
    </Link>
  );
}
