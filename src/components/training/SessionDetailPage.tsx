import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Repeat,
  User,
} from "lucide-react";
import { formatRecurrenceLabel } from "@/lib/training-utils";
import type {
  ScheduleOccurrence,
  SessionCalendarExport,
} from "@/lib/session-calendar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { FunSessionJoinFlow } from "@/components/training/FunSessionJoinFlow";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import { EventReminderButton } from "@/components/calendar/EventReminderButton";
import { FUN_SESSION_CALENDAR_WEEKS } from "@/lib/event-filters";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description: string | null;
  coach: string | null;
  attendanceUrl: string | null;
  recurring: boolean;
  recurrenceWeeks: number;
  recurringFrom: Date | null;
  recurringTo: Date | null;
  sessionDate: Date | null;
};

export function SessionDetailPage({
  session,
  upcomingSchedule,
  calendarExport,
  calendarIcsPath,
  sessionPagePath,
  reminderEventId,
  hasReminder,
  attendanceUrl,
  paymentUrl,
  reclubUsername,
  attendanceOccurrenceDate,
  canAccessAttendance,
  isLoggedIn,
  attendBasePath,
  listPath,
  listLabel,
  siteOrigin,
  openAttendance = false,
}: {
  session: Session;
  upcomingSchedule: ScheduleOccurrence[];
  calendarExport: SessionCalendarExport | null;
  calendarIcsPath: string;
  sessionPagePath: string;
  reminderEventId: string | null;
  hasReminder: boolean;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  reclubUsername: string | null;
  attendanceOccurrenceDate: string | null;
  canAccessAttendance: boolean;
  isLoggedIn: boolean;
  attendBasePath: string;
  listPath: string;
  listLabel: string;
  siteOrigin: string;
  openAttendance?: boolean;
}) {
  const recurrenceLabel = formatRecurrenceLabel(session);
  const oneOffDate =
    !session.recurring && session.sessionDate
      ? format(new Date(session.sessionDate), "EEEE, d MMMM yyyy")
      : null;
  const nextScheduleIndex = upcomingSchedule.findIndex(
    (item) => new Date(item.endDate) >= new Date(),
  );
  const nextOccurrence =
    nextScheduleIndex >= 0 ? upcomingSchedule[nextScheduleIndex] : null;
  const nextSessionStart = nextOccurrence
    ? new Date(nextOccurrence.startDate)
    : calendarExport
      ? new Date(calendarExport.startDate)
      : null;
  const nextSessionEnd = nextOccurrence
    ? new Date(nextOccurrence.endDate)
    : calendarExport
      ? new Date(calendarExport.endDate)
      : null;
  const nextCalendarEventId =
    nextOccurrence?.calendarEventId ?? reminderEventId;
  const nextSessionLocation =
    nextOccurrence?.location ?? calendarExport?.location ?? session.location;

  return (
    <PageContainer>
      <Link
        href={listPath}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {listLabel}
      </Link>

      <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
        <div className="border-b border-jackals-red/20 px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            <Repeat className="h-3.5 w-3.5" />
            Full session schedule
          </div>
        </div>
        <div className="px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-wide text-white sm:text-4xl">
                {session.title}
              </h1>
              <p className="mt-2 text-lg text-zinc-300">
                {oneOffDate ?? recurrenceLabel}
              </p>
            </div>
            <Badge className="shrink-0">{session.level}</Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              {session.startTime} – {session.endTime}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-zinc-500" />
              {session.location}
            </span>
            {session.coach && (
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-zinc-500" />
                Coach: {session.coach}
              </span>
            )}
          </div>

          {session.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {session.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 bg-jackals-surface-muted/50 px-6 py-4">
              <CardTitle>Upcoming dates</CardTitle>
              <CardDescription className="mt-1">
                {session.recurring
                  ? openAttendance
                    ? `Scheduled dates for the next ${FUN_SESSION_CALENDAR_WEEKS} weeks. Tap a date for that session’s details.`
                    : "All upcoming scheduled dates. Tap a date for that session’s details."
                  : "Scheduled date for this session."}
              </CardDescription>
            </div>

            {upcomingSchedule.length === 0 ? (
              <p className="px-6 py-8 text-sm text-zinc-500">
                No upcoming dates scheduled right now. Check back later.
              </p>
            ) : (
              <ul className="divide-y divide-white/10">
                {upcomingSchedule.map((occurrence, index) => {
                  const isNext =
                    index === (nextScheduleIndex >= 0 ? nextScheduleIndex : 0);
                  const start = new Date(occurrence.startDate);
                  const end = new Date(occurrence.endDate);
                  const rowContent = (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div
                          className={cn(
                            "flex h-14 w-14 shrink-0 flex-col items-center justify-center border text-center",
                            isNext
                              ? "border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light"
                              : "border-white/10 bg-jackals-surface text-zinc-300",
                          )}
                        >
                          <span className="text-xs uppercase">
                            {format(start, "MMM")}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {format(start, "d")}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-white">
                            {format(start, "EEEE, d MMMM yyyy")}
                          </p>
                          <p className="text-sm text-zinc-500">
                            {format(start, "HH:mm")} – {format(end, "HH:mm")}
                            {occurrence.location
                              ? ` · ${occurrence.location}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isNext && (
                          <span className="rounded-full bg-jackals-red/15 px-2.5 py-0.5 text-xs font-medium text-jackals-red-light">
                            Next up
                          </span>
                        )}
                        {occurrence.calendarEventId && (
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                        )}
                      </div>
                    </>
                  );

                  return (
                    <li key={occurrence.startDate}>
                      {occurrence.calendarEventId ? (
                        <Link
                          href={`/calendar/${occurrence.calendarEventId}`}
                          className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/5"
                        >
                          {rowContent}
                        </Link>
                      ) : (
                        <div className="flex items-center justify-between gap-4 px-6 py-4">
                          {rowContent}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-jackals-red/30 bg-jackals-surface-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-jackals-red-light" />
              Next upcoming session
            </CardTitle>
            <CardDescription className="mt-2">
              Save the next session to your calendar or bookmark it on your
              dashboard.
            </CardDescription>

            {nextSessionStart && nextSessionEnd ? (
              <div className="mt-4 rounded-lg border border-jackals-red/40 bg-jackals-red/10 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center border border-jackals-red/40 bg-jackals-red/15 text-center text-jackals-red-light">
                    <span className="text-xs uppercase">
                      {format(nextSessionStart, "MMM")}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {format(nextSessionStart, "d")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-jackals-red-light">
                      Next up
                    </span>
                    <p className="mt-1 font-medium text-white">
                      {format(nextSessionStart, "EEEE, d MMMM yyyy")}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {format(nextSessionStart, "HH:mm")} –{" "}
                      {format(nextSessionEnd, "HH:mm")}
                      {nextSessionLocation ? ` · ${nextSessionLocation}` : ""}
                    </p>
                    {nextCalendarEventId && (
                      <Link
                        href={`/calendar/${nextCalendarEventId}`}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-jackals-red-light transition-colors hover:text-jackals-red"
                      >
                        View this date’s event page
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">
                No upcoming session scheduled right now.
              </p>
            )}

            <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
              {calendarExport ? (
                <AddToCalendarActions
                  icsUrl={calendarIcsPath}
                  eventPageUrl={sessionPagePath}
                  siteOrigin={siteOrigin}
                  event={{
                    id: calendarExport.id,
                    title: calendarExport.title,
                    description: calendarExport.description,
                    startDate: calendarExport.startDate,
                    endDate: calendarExport.endDate,
                    location: calendarExport.location,
                  }}
                />
              ) : (
                <p className="text-sm text-zinc-500">
                  No upcoming session to add to your calendar yet.
                </p>
              )}

              {isLoggedIn && reminderEventId && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    Club reminder
                  </p>
                  <p className="text-xs text-zinc-500">
                    Save this date to your member dashboard. This is separate
                    from adding it to your phone or desktop calendar.
                  </p>
                  <EventReminderButton
                    eventId={reminderEventId}
                    initialHasReminder={hasReminder}
                  />
                </div>
              )}

              {openAttendance && !paymentUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-zinc-300">
                    ReClub registration
                  </p>
                  {attendanceUrl ? (
                    <AttendanceLink
                      sessionId={session.id}
                      basePath={attendBasePath}
                      occurrenceDate={attendanceOccurrenceDate}
                      label={
                        nextSessionStart
                          ? `Register for ${format(nextSessionStart, "EEE d MMM")} on Reclub`
                          : "Register on ReClub"
                      }
                      variant="primary"
                    />
                  ) : (
                    <ReclubLinkUnavailable />
                  )}
                </div>
              )}

              {!openAttendance || !paymentUrl ? (
                <>
                  {!openAttendance && attendanceUrl && canAccessAttendance && (
                    <AttendanceLink
                      sessionId={session.id}
                      basePath={attendBasePath}
                      occurrenceDate={attendanceOccurrenceDate}
                      label={
                        nextSessionStart
                          ? `Register for ${format(nextSessionStart, "EEE d MMM")} on Reclub`
                          : "Register attendance on Reclub"
                      }
                      variant="primary"
                    />
                  )}

                  {!openAttendance && attendanceUrl &&
                    !canAccessAttendance &&
                    isLoggedIn && (
                      <Link href="/membership">
                        <Button className="w-full">Get membership to register</Button>
                      </Link>
                    )}

                  {!openAttendance && attendanceUrl && !isLoggedIn && (
                    <Link href={`/login?callbackUrl=${attendBasePath}/${session.id}`}>
                      <Button className="w-full">Sign in to register attendance</Button>
                    </Link>
                  )}
                </>
              ) : null}
            </div>
          </Card>

          {openAttendance && paymentUrl && (
            <FunSessionJoinFlow
              paymentUrl={paymentUrl}
              sessionTitle={session.title}
              sessionDate={nextSessionStart ?? attendanceOccurrenceDate}
              reclubUsername={reclubUsername}
              payLabel={
                nextSessionStart
                  ? `Pay for ${format(nextSessionStart, "EEE d MMM")}`
                  : "Pay on ReClub"
              }
              attendanceUrl={attendanceUrl}
              sessionId={session.id}
              attendBasePath={attendBasePath}
              attendanceOccurrenceDate={attendanceOccurrenceDate}
              attendanceLabel={
                nextSessionStart
                  ? `Register for ${format(nextSessionStart, "EEE d MMM")}`
                  : "Register on ReClub"
              }
            />
          )}

          <Card>
            <CardDescription>
              Looking for one specific date? Pick it from the schedule — each
              date has its own event page with calendar export and reminders.
            </CardDescription>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
