import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Clock, MapPin, User } from "lucide-react";
import type { EventListItem } from "@/lib/event-filters";
import { getBrowseEventTypeLabel } from "@/lib/events-config";
import { getEventDisplayStyle, formatEventDateTime } from "@/lib/event-display";
import { isOpenReclubEvent, usesPaidJoinFlow, usesTournamentJoinFlow } from "@/lib/event-reclub";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";
import { FunSessionJoinFlow } from "@/components/training/FunSessionJoinFlow";
import { TournamentJoinFlow } from "@/components/training/TournamentJoinFlow";
import { ReclubLinkUnavailable } from "@/components/training/ReclubLinkUnavailable";
import { TrainingAttendanceStatusBadge } from "@/components/training/TrainingAttendancePicker";
import { AddToCalendarActions } from "@/components/calendar/AddToCalendarActions";
import type { TrainingAttendanceStatus } from "@/lib/training-attendance-config";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { cn } from "@/lib/utils";

export function EventDetailPage({
  event,
  schedulePath,
  attendanceUrl,
  paymentUrl,
  attendanceOccurrenceDate,
  attendBasePath,
  openAttendance,
  canAccessAttendance,
  isLoggedIn,
  siteOrigin,
  listPath = "/events",
  listLabel = "events",
  initialAttendanceStatus = "UNANSWERED",
}: {
  event: EventListItem;
  schedulePath: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  attendanceOccurrenceDate: string | null;
  attendBasePath: string | null;
  openAttendance: boolean;
  canAccessAttendance: boolean;
  isLoggedIn: boolean;
  siteOrigin: string;
  listPath?: string;
  listLabel?: string;
  initialAttendanceStatus?: TrainingAttendanceStatus;
}) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    event.startDate,
    event.endDate,
  );
  const bodyDescription = event.sessionDescription ?? event.description;
  const isSessionEvent = Boolean(event.trainingSessionId);
  const isOpenReclub = isOpenReclubEvent(event.type);
  const isTrainingEvent = event.type === "TRAINING";
  const showAttendance = (isSessionEvent || isOpenReclub) && !isTrainingEvent;
  const attendanceEntityId = event.trainingSessionId ?? event.id;
  const typeStyle = getEventDisplayStyle(event);

  const showFunJoinFlow =
    usesPaidJoinFlow(event.type) && Boolean(paymentUrl);
  const showTournamentJoinFlow = usesTournamentJoinFlow(event);
  const showStructuredJoinFlow = showFunJoinFlow || showTournamentJoinFlow;

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
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <PageHeader title={event.title} description={dateLabel} />
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              typeStyle.badge,
            )}
          >
            {getBrowseEventTypeLabel({
              type: event.type,
              title: event.title,
              description: event.sessionDescription ?? event.description,
            })}
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
                    View schedule details
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    See the session details and upcoming dates
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

          {isTrainingEvent && (
            <Card>
              <CardTitle>Squad training</CardTitle>
              <CardDescription className="mt-2">
                Respond for this session and see which teammates are attending.
              </CardDescription>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {isLoggedIn && initialAttendanceStatus !== "UNANSWERED" && (
                  <TrainingAttendanceStatusBadge status={initialAttendanceStatus} />
                )}
                <Link href={`/training/session/${event.id}`}>
                  <Button>
                    View session
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
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
        </div>
      </div>
      </AnimateIn>
    </PageContainer>
  );
}
