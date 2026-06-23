"use client";

import { CalendarPlus } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  type CalendarExportEvent,
} from "@/lib/calendar-export";
import { absoluteSiteUrl } from "@/lib/site-url";
import { Button } from "@/components/ui/Button";

function resolveEventPageUrl(
  siteOrigin: string | undefined,
  eventPageUrlProp: string | undefined,
  fallbackPath: string,
) {
  if (!siteOrigin) return undefined;
  if (eventPageUrlProp) return absoluteSiteUrl(siteOrigin, eventPageUrlProp);
  return absoluteSiteUrl(siteOrigin, fallbackPath);
}

export function AddToCalendarActions({
  event,
  icsUrl,
  eventPageUrl: eventPageUrlProp,
  siteOrigin,
  compact = false,
}: {
  event: CalendarExportEvent;
  icsUrl?: string;
  /** Relative path or absolute URL to the event/session page */
  eventPageUrl?: string;
  /** Server-provided origin, e.g. https://jackalsvolleyball.com — avoids client-only window access */
  siteOrigin?: string;
  compact?: boolean;
}) {
  const downloadUrl = icsUrl ?? `/api/events/${event.id}/calendar`;
  const eventPageUrl = resolveEventPageUrl(
    siteOrigin,
    eventPageUrlProp,
    `/calendar/${event.id}`,
  );
  const googleUrl = buildGoogleCalendarUrl(event, eventPageUrl);

  if (compact) {
    return (
      <a
        href={downloadUrl}
        download
        title="Add to calendar"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/5 hover:text-jackals-red-light"
        onClick={(e) => e.stopPropagation()}
      >
        <CalendarPlus className="h-4 w-4" />
      </a>
    );
  }

  return (
    <div className="space-y-2">
      <a href={downloadUrl} download className="block">
        <Button type="button" variant="outline" className="w-full">
          <CalendarPlus className="h-4 w-4" />
          Add to Apple / Outlook calendar
        </Button>
      </a>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button type="button" variant="outline" className="w-full">
          Add to Google Calendar
        </Button>
      </a>
      <p className="text-xs text-zinc-500">
        Works on phone, tablet, and desktop. Includes a reminder 1 day before.
      </p>
    </div>
  );
}
