import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
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
}: {
  session: TrainingSessionCardData;
  detailBasePath: string;
  showRecurrence?: string;
  className?: string;
}) {
  const recurrence =
    showRecurrence ?? sessionRecurrenceLabel(session);

  return (
    <Link
      href={`${detailBasePath}/${session.id}`}
      className="group block h-full"
    >
      <Card
        className={cn(
          "motion-hover-lift h-full group-hover:border-jackals-red/40 group-hover:bg-jackals-surface",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <CardTitle>{session.title}</CardTitle>
          <Badge>{session.level}</Badge>
        </div>

        <div className="space-y-2 text-sm text-zinc-400">
          {recurrence && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
              {recurrence}
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
      </Card>
    </Link>
  );
}
