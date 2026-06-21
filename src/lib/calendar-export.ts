export type CalendarExportEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
};

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function eventEndDate(event: CalendarExportEvent) {
  if (event.endDate) return new Date(event.endDate);
  const start = new Date(event.startDate);
  return new Date(start.getTime() + 60 * 60 * 1000);
}

export function buildGoogleCalendarUrl(
  event: CalendarExportEvent,
  eventPageUrl?: string,
) {
  const start = new Date(event.startDate);
  const end = eventEndDate(event);
  const details = [event.description, eventPageUrl && `More info: ${eventPageUrl}`]
    .filter(Boolean)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsUtc(start)}/${toIcsUtc(end)}`,
    details,
    location: event.location ?? "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(
  event: CalendarExportEvent,
  options?: { eventPageUrl?: string; uid?: string },
) {
  const start = new Date(event.startDate);
  const end = eventEndDate(event);
  const now = new Date();
  const descriptionParts = [
    event.description,
    options?.eventPageUrl && `More info: ${options.eventPageUrl}`,
  ].filter(Boolean);
  const description = descriptionParts.join("\n\n");
  const uid = options?.uid ?? `${event.id}@jackalsvc.com`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jackals VC//Calendar Export//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsUtc(now)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    event.location ? `LOCATION:${escapeIcsText(event.location)}` : null,
    options?.eventPageUrl ? `URL:${options.eventPageUrl}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcsText(`Reminder: ${event.title}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function icsFilename(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "event"}.ics`;
}

export function createIcsDownloadResponse(
  ics: string,
  title: string,
): Response {
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFilename(title)}"`,
      "Cache-Control": "no-store",
    },
  });
}
