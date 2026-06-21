import { redirect } from "next/navigation";
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
      SESSION_CATEGORIES.WEEKLY,
    );
    return { title: session.title };
  } catch {
    return { title: "Training session" };
  }
}

export default async function TrainingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const authSession = await auth();

  if (!authSession?.user) {
    redirect(`/login?callbackUrl=/training/${id}`);
  }

  const context = await getSessionDetailPageContext(
    id,
    SESSION_CATEGORIES.WEEKLY,
    authSession.user.id,
  );
  const canAccessAttendance = await hasAttendanceAccess(authSession.user);
  const config = SESSION_MANAGER_CONFIG.WEEKLY;
  const siteOrigin = await getSiteUrl();

  return (
    <SessionDetailPage
      session={context.session}
      upcomingSchedule={context.upcomingSchedule}
      calendarExport={context.calendarExport}
      calendarIcsPath={sessionCalendarIcsPath(id, SESSION_CATEGORIES.WEEKLY)}
      sessionPagePath={`${config.publicPath}/${id}`}
      reminderEventId={context.reminderEventId}
      hasReminder={context.hasReminder}
      attendanceUrl={context.attendanceUrl}
      paymentUrl={context.paymentUrl}
      reclubUsername={context.session.reclubUsername}
      sessionFee={context.session.sessionFee}
      attendanceOccurrenceDate={context.attendanceOccurrenceDate}
      canAccessAttendance={canAccessAttendance}
      isLoggedIn
      attendBasePath={config.attendPath}
      listPath={config.publicPath}
      listLabel={config.seriesName}
      siteOrigin={siteOrigin}
    />
  );
}
