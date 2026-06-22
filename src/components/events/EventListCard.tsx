import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin } from "lucide-react";
import { getBrowseEventTypeLabel } from "@/lib/events-config";
import {
  eventDetailPath,
  formatEventDateTime,
  getEventDisplayStyle,
} from "@/lib/event-display";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { cn, formatEuroFee } from "@/lib/utils";

export type EventCardData = {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  description?: string | null;
  sessionDescription?: string | null;
  sessionFee?: number | null;
};

export function EventListCard({
  event,
  href,
  feeLabel,
  cta = "arrow",
  className,
}: {
  event: EventCardData;
  href?: string;
  feeLabel?: string;
  cta?: "arrow" | "text";
  className?: string;
}) {
  const style = getEventDisplayStyle(event);
  const { dateLabel, timeLabel } = formatEventDateTime(
    event.startDate,
    event.endDate,
  );
  const resolvedFeeLabel =
    feeLabel ?? (event.type === "TOURNAMENT" ? "tournament fee" : "session fee");
  const description = event.sessionDescription ?? event.description;
  const linkHref = href ?? eventDetailPath(event.id);

  return (
    <Link href={linkHref} className="group block h-full">
      <Card
        className={cn(
          "motion-hover-lift relative h-full overflow-hidden border-white/10 bg-jackals-surface/90 p-0 group-hover:border-jackals-red/30 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
          className,
        )}
      >
        <div className={cn("h-1 w-full", style.dot)} aria-hidden />
        <div className="p-6">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
              style.badge,
            )}
          >
            {getBrowseEventTypeLabel({
              type: event.type,
              title: event.title,
              description: event.description ?? event.sessionDescription,
            })}
          </span>
          <CardTitle className="mt-3">{event.title}</CardTitle>
          <div className="mt-4 space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
              {dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
              {timeLabel}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                {event.location}
              </div>
            )}
          </div>
          {event.sessionFee != null && (
            <p className="mt-3 text-sm font-medium text-zinc-300">
              {formatEuroFee(event.sessionFee)}{" "}
              <span className="font-normal text-zinc-500">{resolvedFeeLabel}</span>
            </p>
          )}
          {description && (
            <CardDescription className="mt-3 line-clamp-2">
              {description}
            </CardDescription>
          )}
          {cta === "arrow" ? (
            <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
              View details
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </p>
          ) : (
            <p className="mt-4 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
              View details →
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
