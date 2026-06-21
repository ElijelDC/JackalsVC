import { format } from "date-fns";

export function formatEventDateTime(
  startDate: string,
  endDate: string | null,
) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  return {
    dateLabel: format(start, "EEEE, d MMMM yyyy"),
    timeLabel: end
      ? `${format(start, "HH:mm")} – ${format(end, "HH:mm")}`
      : format(start, "HH:mm"),
  };
}

export function eventDetailPath(eventId: string) {
  return `/calendar/${eventId}`;
}
