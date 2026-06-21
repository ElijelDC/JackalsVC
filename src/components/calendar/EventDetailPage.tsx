import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin, User } from "lucide-react";
import type { EventListItem } from "@/lib/event-filters";
import { getEventTypeLabel } from "@/lib/event-filters";
import { formatEventDateTime } from "@/lib/event-display";
import { isOpenReclubEvent, usesPaidJoinFlow, usesTournamentJoinFlow } from "@/lib/event-reclub";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { FunSessionJoinFlow } from "@/components/training/FunSessionJoinFlow";
import { TournamentJoinFlow } from "@/components/training/TournamentJoinFlow";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import { EventReminderButton } from "@/components/calendar/EventReminderButton";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  TRAINING: "bg-blue-500/15 text-blue-400",
  FUN: "bg-amber-500/15 text-amber-400",
  TOURNAMENT: "bg-jackals-red/15 text-jackals-red-light",
  SOCIAL: "bg-purple-500/15 text-purple-400",
  MEETING: "bg-green-500/15 text-green-400",
};

export function EventDetailPage({
  event,
  hasReminder = false,
  schedulePath,
  attendanceUrl,
  paymentUrl,
  attendanceOccurrenceDate,
  attendBasePath,
  openAttendance,
  canAccessAttendance,
  isLoggedIn,
  siteOrigin,
}: {
  event: EventListItem;
  hasReminder?: boolean;
  schedulePath: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  attendanceOccurrenceDate: string | null;
  attendBasePath: string | null;
  openAttendance: boolean;
  canAccessAttendance: boolean;
  isLoggedIn: boolean;
  siteOrigin: string;
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    event.startDate,
    event.endDate,
  );
  const bodyDescription = event.sessionDescription ?? event.description;
  const isSessionEvent = Boolean(event.trainingSessionId);
  const isOpenReclub = isOpenReclubEvent(event.type);
  const showAttendance = isSessionEvent || isOpenReclub;
  const attendanceEntityId = event.trainingSessionId ?? event.id;
  const typeColor =
    typeColors[event.type] ?? "bg-zinc-500/15 text-zinc-400";

  const showFunJoinFlow =
    usesPaidJoinFlow(event.type) && Boolean(paymentUrl);
  const showTournamentJoinFlow = usesTournamentJoinFlow(event);
  const showStructuredJoinFlow = showFunJoinFlow || showTournamentJoinFlow;

  return (
    <PageContainer>
      <AnimateIn immediate>
        <Link
          href="/calendar"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
        >
          ← Back to calendar
        </Link>
      </AnimateIn>

      <AnimateIn delay={50}>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <PageHeader title={event.title} description={dateLabel} />
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              typeColor,
            )}
          >
            {getEventTypeLabel(event.type)}
          </span>
        </div>
      </AnimateIn>

      <AnimateIn delay={100}>
      <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
        <Card className="lg:col-span-2">
          <CardTitle>Event details</CardTitle>

          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <span>{dateLabel}</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <span>{timeLabel}</span>
            </div>
            {event.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <span>{event.location}</span>
              </div>
            )}
            {event.coach && (
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                <span>Coach: {event.coach}</span>
              </div>
            )}
          </div>

          {bodyDescription && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                About this event
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-300">
                {bodyDescription}
              </p>
            </div>
          )}

          {schedulePath && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <Link
                href={schedulePath}
                className="group flex items-center justify-between gap-4 rounded-lg border border-jackals-red/30 bg-jackals-red/10 px-4 py-4 transition-colors hover:border-jackals-red/50 hover:bg-jackals-red/15"
              >
                <div>
                  <p className="font-medium text-white">
                    View full recurring schedule
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    See all upcoming dates for this session
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-jackals-red-light transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {showTournamentJoinFlow && (
            <TournamentJoinFlow
              attendanceUrl={attendanceUrl}
              sessionId={attendanceEntityId}
              attendBasePath={attendBasePath ?? "/calendar"}
              tournamentFee={event.sessionFee}
              clubIban={event.clubIban}
            />
          )}

          {showFunJoinFlow && (
            <FunSessionJoinFlow
              paymentUrl={paymentUrl!}
              payLabel="Pay on ReClub"
              sessionTitle={event.title}
              sessionDate={event.startDate}
              reclubUsername={event.reclubUsername}
              sessionFee={event.sessionFee}
              attendanceUrl={attendanceUrl}
              sessionId={attendanceEntityId}
              attendBasePath={attendBasePath ?? "/fun-sessions"}
              attendanceOccurrenceDate={attendanceOccurrenceDate}
              attendanceLabel="Register on ReClub"
              showPayBeforeNote
            />
          )}

          {showAttendance && !showStructuredJoinFlow && (
            <Card>
              <CardTitle>
                {isOpenReclub ? "Registration" : "Attendance"}
              </CardTitle>
              <CardDescription className="mt-2">
                {attendanceUrl
                  ? isOpenReclub
                    ? "Register on Reclub — open to everyone."
                    : openAttendance
                      ? "Register attendance on Reclub — open to everyone."
                      : "Paid membership is required to register attendance via Reclub."
                  : "Registration on ReClub is not available yet."}
              </CardDescription>

              <div className="mt-6 space-y-3">
                {attendanceUrl &&
                  attendBasePath &&
                  (openAttendance || canAccessAttendance) && (
                    <AttendanceLink
                      sessionId={attendanceEntityId}
                      basePath={attendBasePath}
                      occurrenceDate={attendanceOccurrenceDate}
                      label={
                        isOpenReclub
                          ? "Register on Reclub"
                          : "Register attendance on Reclub"
                      }
                      variant="primary"
                    />
                  )}

                {attendanceUrl &&
                  !openAttendance &&
                  !canAccessAttendance &&
                  isLoggedIn && (
                    <Link href="/membership">
                      <Button className="w-full">Get membership to register</Button>
                    </Link>
                  )}

                {attendanceUrl && !openAttendance && !isLoggedIn && (
                  <Link href={`/login?callbackUrl=/calendar/${event.id}`}>
                    <Button className="w-full">Sign in to register attendance</Button>
                  </Link>
                )}

                {!attendanceUrl && <ReclubLinkUnavailable />}
              </div>
            </Card>
          )}

          <Card className="bg-jackals-surface-muted/20">
            <CardTitle className="text-sm">Add to calendar</CardTitle>
            <CardDescription className="mt-2 text-xs">
              Save to your phone or desktop calendar — no account needed.
            </CardDescription>
            <div className="mt-4">
              <AddToCalendarActions
                siteOrigin={siteOrigin}
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.sessionDescription ?? event.description,
                  startDate: event.startDate,
                  endDate: event.endDate,
                  location: event.location,
                }}
              />
            </div>
          </Card>

          {isLoggedIn && (
            <Card className="bg-jackals-surface-muted/20">
              <CardTitle className="text-sm">Club reminder</CardTitle>
              <CardDescription className="mt-2 text-xs">
                Bookmark this event on your member dashboard.
              </CardDescription>
              <div className="mt-4">
                <EventReminderButton
                  eventId={event.id}
                  initialHasReminder={hasReminder}
                />
              </div>
            </Card>
          )}
        </div>
      </div>
      </AnimateIn>
    </PageContainer>
  );
}
