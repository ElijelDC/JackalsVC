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
import { Card, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { FunSessionJoinFlow } from "@/components/training/FunSessionJoinFlow";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { TrainingAttendanceActions } from "@/components/training/TrainingAttendanceActions";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import { AnimateIn } from "@/components/motion/AnimateIn";
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
  linkedCalendarEventId,
  attendanceUrl,
  paymentUrl,
  reclubUsername,
  sessionFee,
  attendanceOccurrenceDate,
  canAccessAttendance,
  isLoggedIn,
  attendBasePath,
  listPath,
  listLabel,
  siteOrigin,
  openAttendance = false,
  signedUpEventIds = [],
}: {
  session: Session;
  upcomingSchedule: ScheduleOccurrence[];
  calendarExport: SessionCalendarExport | null;
  calendarIcsPath: string;
  sessionPagePath: string;
  linkedCalendarEventId: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  reclubUsername: string | null;
  sessionFee: number | null;
  attendanceOccurrenceDate: string | null;
  canAccessAttendance: boolean;
  isLoggedIn: boolean;
  attendBasePath: string;
  listPath: string;
  listLabel: string;
  siteOrigin: string;
  openAttendance?: boolean;
  signedUpEventIds?: string[];
}) {
  const signedUpIds = new Set(signedUpEventIds);
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
    nextOccurrence?.calendarEventId ?? linkedCalendarEventId;
  const nextSessionLocation =
    nextOccurrence?.location ?? calendarExport?.location ?? session.location;

  return (
    <PageContainer>
      <AnimateIn immediate>
        <Link
          href={listPath}
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {listLabel}
        </Link>
      </AnimateIn>

      <AnimateIn delay={50}>
      <div className="mb-8 overflow-hidden border border-jackals-red/25 bg-gradient-to-br from-jackals-red/15 via-jackals-surface to-jackals-surface">
        <div className="border-b border-jackals-red/20 px-6 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
            <CalendarDays className="h-3.5 w-3.5" />
            Session details
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
      </AnimateIn>

      {/* Actions & registration — immediately after session info */}
      <AnimateIn delay={100}>
      <div className="max-w-3xl space-y-6">
        {/* Join / Pay / Register */}
        {openAttendance && paymentUrl && (
          <FunSessionJoinFlow
            paymentUrl={paymentUrl}
            sessionTitle={session.title}
            sessionDate={nextSessionStart ?? attendanceOccurrenceDate}
            reclubUsername={reclubUsername}
            sessionFee={sessionFee}
            payLabel={
              nextSessionStart
                ? `Pay for ${format(nextSessionStart, "EEE d MMM")}`
                : "Session Payment Link"
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

        {openAttendance && !paymentUrl && attendanceUrl && (
          <Card className="border-jackals-red/30">
            <p className="text-sm font-medium text-zinc-300">
              ReClub registration
            </p>
            <div className="mt-2">
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
            </div>
          </Card>
        )}

        {openAttendance && !paymentUrl && !attendanceUrl && (
          <Card className="border-jackals-red/30">
            <p className="text-sm font-medium text-zinc-300">
              ReClub registration
            </p>
            <div className="mt-2">
              <ReclubLinkUnavailable />
            </div>
          </Card>
        )}

        {!openAttendance && nextCalendarEventId && (
          <TrainingAttendanceActions
            eventId={nextCalendarEventId}
            initialStatus={
              signedUpIds.has(nextCalendarEventId) ? "ATTENDING" : "UNANSWERED"
            }
            canAccessAttendance={canAccessAttendance}
            isLoggedIn={isLoggedIn}
            signInUrl={`/login?callbackUrl=${sessionPagePath}`}
            detailHref={`/training/session/${nextCalendarEventId}`}
          />
        )}

        {/* Add to calendar */}
        {calendarExport && (
          <Card className="border-white/10">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-jackals-red-light" />
              Add to calendar
            </CardTitle>
            <div className="mt-3">
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
            </div>
          </Card>
        )}
      </div>
      </AnimateIn>

      {/* Recurring dates — small section at the bottom */}
      {session.recurring && upcomingSchedule.length > 0 && (
        <AnimateIn delay={150}>
        <div className="mt-10 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
            <Repeat className="h-4 w-4" />
            Upcoming dates
          </div>
          <div className="divide-y divide-white/5 rounded-lg border border-white/10 bg-jackals-surface-muted/30">
            {upcomingSchedule.map((occurrence, index) => {
              const isNext =
                index === (nextScheduleIndex >= 0 ? nextScheduleIndex : 0);
              const start = new Date(occurrence.startDate);
              const end = new Date(occurrence.endDate);
              const content = (
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        isNext ? "bg-jackals-red-light" : "bg-zinc-600",
                      )}
                    />
                    <span className={cn("font-medium", isNext ? "text-white" : "text-zinc-300")}>
                      {format(start, "EEE, d MMM")}
                    </span>
                    <span className="text-zinc-500">
                      {format(start, "HH:mm")} – {format(end, "HH:mm")}
                    </span>
                    {occurrence.location && occurrence.location !== session.location && (
                      <span className="text-zinc-600">· {occurrence.location}</span>
                    )}
                  </div>
                  {isNext && (
                    <span className="rounded-full bg-jackals-red/15 px-2 py-0.5 text-[10px] font-medium text-jackals-red-light">
                      Next
                    </span>
                  )}
                  {occurrence.calendarEventId && (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                </div>
              );

              return (
                <div key={occurrence.startDate}>
                  {occurrence.calendarEventId ? (
                    <Link
                      href={`/calendar/${occurrence.calendarEventId}`}
                      className="block transition-colors hover:bg-white/5"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </AnimateIn>
      )}

      {/* One-off date */}
      {!session.recurring && upcomingSchedule.length > 0 && (
        <AnimateIn delay={150}>
        <div className="mt-10 max-w-3xl">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            Scheduled date
          </div>
          <div className="rounded-lg border border-white/10 bg-jackals-surface-muted/30 px-4 py-3">
            {upcomingSchedule.map((occurrence) => {
              const start = new Date(occurrence.startDate);
              const end = new Date(occurrence.endDate);
              return (
                <div key={occurrence.startDate} className="flex items-center gap-3 text-sm">
                  <span className="inline-block h-2 w-2 rounded-full bg-jackals-red-light" />
                  <span className="font-medium text-white">
                    {format(start, "EEEE, d MMMM yyyy")}
                  </span>
                  <span className="text-zinc-500">
                    {format(start, "HH:mm")} – {format(end, "HH:mm")}
                  </span>
                  {occurrence.location && (
                    <span className="text-zinc-600">· {occurrence.location}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </AnimateIn>
      )}
    </PageContainer>
  );
}
