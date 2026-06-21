import { auth } from "@/auth";
import { hasAttendanceAccess } from "@/lib/membership";
import {
  getSessionDetailPageContext,
  sessionCalendarIcsPath,
} from "@/lib/session-calendar";
import {
  SESSION_CATEGORIES,
  SESSION_MANAGER_CONFIG,
} from "@/lib/training-utils";
import { getSiteUrl } from "@/lib/site-url.server";
import { SessionDetailPage } from "@/components/training/SessionDetailPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const { session } = await getSessionDetailPageContext(
      id,
      SESSION_CATEGORIES.FUN,
    );
    return { title: session.title };
  } catch {
    return { title: "Fun session" };
  }
}

export default async function FunSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authSession = await auth();
  const isLoggedIn = Boolean(authSession?.user);

  const context = await getSessionDetailPageContext(
    id,
    SESSION_CATEGORIES.FUN,
    authSession?.user?.id,
  );
  const canAccessAttendance =
    isLoggedIn && authSession?.user
      ? await hasAttendanceAccess(authSession.user)
      : false;
  const config = SESSION_MANAGER_CONFIG.FUN;
  const siteOrigin = await getSiteUrl();

  return (
    <SessionDetailPage
      session={context.session}
      upcomingSchedule={context.upcomingSchedule}
      calendarExport={context.calendarExport}
      calendarIcsPath={sessionCalendarIcsPath(id, SESSION_CATEGORIES.FUN)}
      sessionPagePath={`${config.publicPath}/${id}`}
      reminderEventId={context.reminderEventId}
      hasReminder={context.hasReminder}
      attendanceUrl={context.attendanceUrl}
      paymentUrl={context.paymentUrl}
      reclubUsername={context.session.reclubUsername}
      sessionFee={context.session.sessionFee}
      attendanceOccurrenceDate={context.attendanceOccurrenceDate}
      canAccessAttendance={canAccessAttendance}
      isLoggedIn={isLoggedIn}
      attendBasePath={config.attendPath}
      listPath="/whats-on"
      listLabel="What's On?"
      siteOrigin={siteOrigin}
      openAttendance
    />
  );
}
