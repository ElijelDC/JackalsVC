import { format } from "date-fns";

/** Format an ISO date string for `<input type="datetime-local">` in local time. */
export function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}
