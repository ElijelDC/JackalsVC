import { auth } from "@/auth";
import { EventDetailPage } from "@/components/calendar/EventDetailPage";
import { hasAttendanceAccess } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url.server";
import {
  getEventAttendanceContext,
  getPublicEvent,
  sessionSchedulePath,
} from "@/lib/public-events";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const session = await auth();
    const event = await getPublicEvent(id, Boolean(session?.user));
    return { title: event.title };
  } catch {
    return { title: "Event" };
  }
}

export default async function CalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const event = await getPublicEvent(id, isLoggedIn);
  const schedulePath = sessionSchedulePath(event);
  const attendance = await getEventAttendanceContext(event);

  const hasReminder = isLoggedIn
    ? Boolean(
        await prisma.eventReminder.findFirst({
          where: { userId: session!.user!.id, eventId: id },
        }),
      )
    : false;

  const canAccessAttendance =
    isLoggedIn && session?.user
      ? await hasAttendanceAccess(session.user)
      : false;
  const siteOrigin = await getSiteUrl();

  return (
    <EventDetailPage
      event={event}
      hasReminder={hasReminder}
      schedulePath={schedulePath}
      attendanceUrl={attendance.attendanceUrl}
      paymentUrl={attendance.paymentUrl}
      attendanceOccurrenceDate={attendance.attendanceOccurrenceDate}
      attendBasePath={attendance.attendBasePath}
      openAttendance={attendance.openAttendance}
      canAccessAttendance={canAccessAttendance}
      isLoggedIn={isLoggedIn}
      siteOrigin={siteOrigin}
    />
  );
}
