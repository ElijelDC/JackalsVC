import { notFound, redirect } from "next/navigation";
import { getPublicEvent } from "@/lib/public-events";
import { isOpenReclubEvent } from "@/lib/event-reclub";

export async function redirectToCalendarEventAttendance(
  eventId: string,
  isLoggedIn: boolean,
) {
  const event = await getPublicEvent(eventId, isLoggedIn);

  if (!isOpenReclubEvent(event.type) || !event.attendanceUrl) {
    notFound();
  }

  redirect(event.attendanceUrl);
}
