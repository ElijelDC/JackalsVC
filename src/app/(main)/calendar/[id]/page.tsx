import { auth } from "@/auth";
import { EventDetailPage } from "@/components/calendar/EventDetailPage";
import { hasAttendanceAccess } from "@/lib/membership";
import {
  getEventAttendanceContext,
  getPublicEvent,
} from "@/lib/public-events";
import {
  isReclubCompetitionId,
  parseReclubCompetitionId,
  parseReclubReferenceCode,
} from "@/lib/reclub-config";
import { fetchReclubMeetConfirmedParticipants } from "@/lib/reclub-payload";
import { getUserEventAttendanceStatuses } from "@/lib/training-attendance";
import { resolveCoachAttendanceStatus } from "@/lib/training-attendance-config";
import { getSiteUrl } from "@/lib/site-url.server";
import { resolveEventsBackLink } from "@/lib/events-config";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const event = await getPublicEvent(id, isLoggedIn);
  const attendance = await getEventAttendanceContext(event);
  const eventsBack = resolveEventsBackLink(from);
  const attendanceUrl = attendance.attendanceUrl ?? event.attendanceUrl ?? "";
  const competitionId =
    (event.reclubReferenceCode && isReclubCompetitionId(event.reclubReferenceCode)
      ? event.reclubReferenceCode
      : parseReclubCompetitionId(attendanceUrl)) ?? null;
  const reclubReferenceCode = parseReclubReferenceCode(attendanceUrl) ?? null;
  const reclubConfirmedParticipants =
    reclubReferenceCode && !competitionId
      ? await fetchReclubMeetConfirmedParticipants(reclubReferenceCode)
      : [];

  const canAccessAttendance =
    isLoggedIn && session?.user
      ? await hasAttendanceAccess(session.user)
      : false;
  const rawAttendanceStatus =
    isLoggedIn && session?.user && event.type === "TRAINING"
      ? (
          await getUserEventAttendanceStatuses(session.user.id, [id])
        ).get(id) ?? "UNANSWERED"
      : "UNANSWERED";
  const initialAttendanceStatus =
    isLoggedIn && session?.user?.isCoach && event.type === "TRAINING"
      ? resolveCoachAttendanceStatus(
          rawAttendanceStatus,
          new Date(event.startDate),
        )
      : rawAttendanceStatus;
  const siteOrigin = await getSiteUrl();

  return (
    <EventDetailPage
      event={event}
      attendanceUrl={attendance.attendanceUrl}
      paymentUrl={attendance.paymentUrl}
      attendanceOccurrenceDate={attendance.attendanceOccurrenceDate}
      attendBasePath={attendance.attendBasePath}
      openAttendance={attendance.openAttendance}
      canAccessAttendance={canAccessAttendance}
      isLoggedIn={isLoggedIn}
      siteOrigin={siteOrigin}
      listPath={eventsBack?.path}
      listLabel={eventsBack?.label}
      initialAttendanceStatus={initialAttendanceStatus}
      reclubConfirmedParticipants={reclubConfirmedParticipants}
    />
  );
}
