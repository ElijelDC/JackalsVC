import { notFound, redirect } from "next/navigation";
import { getPublicEvent } from "@/lib/public-events";
import { isOpenReclubEvent } from "@/lib/event-reclub";
import { isExternalAttendanceUrl } from "@/lib/reclub-config";

export async function redirectToCalendarEventAttendance(
  eventId: string,
  isLoggedIn: boolean,
) {
  const event = await getPublicEvent(eventId, isLoggedIn);

  if (!event.attendanceUrl || !isExternalAttendanceUrl(event.attendanceUrl)) {
    notFound();
  }

  const canRedirect =
    isOpenReclubEvent(event.type) ||
    (event.type === "FUN" && !event.trainingSessionId);

  if (!canRedirect) {
    notFound();
  }

  redirect(event.attendanceUrl);
}
