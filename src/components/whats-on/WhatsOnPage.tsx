import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { formatRecurrenceLabel } from "@/lib/training-utils";
import { DAYS_OF_WEEK, formatEuroFee } from "@/lib/utils";
import type { WhatsOnCalendarEvent } from "@/lib/whats-on";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import {
  eventDetailPath,
  formatEventDateTime,
  getEventTypeStyle,
} from "@/lib/event-display";
import { getEventTypeLabel } from "@/lib/event-filters";
import { cn } from "@/lib/utils";

type FunSession = {
  id: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description: string | null;
  coach: string | null;
  recurring: boolean;
  recurrenceWeeks: number;
  recurringFrom: Date | null;
  recurringTo: Date | null;
  sessionDate: Date | null;
};

function FunSessionCard({ session }: { session: FunSession }) {
  const showRecurrence = session.recurring
    ? formatRecurrenceLabel(session)
    : session.sessionDate
      ? format(new Date(session.sessionDate), "EEEE, d MMMM yyyy")
      : undefined;

  return (
    <Link href={`/fun-sessions/${session.id}`} className="group block h-full">
      <Card className="motion-hover-lift h-full group-hover:border-jackals-red/40 group-hover:bg-jackals-surface">
        <div className="mb-3 flex items-start justify-between gap-2">
          <CardTitle>{session.title}</CardTitle>
          <Badge>{session.level}</Badge>
        </div>
        <div className="space-y-2 text-sm text-zinc-400">
          {showRecurrence && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
              {showRecurrence}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
            {session.startTime} – {session.endTime}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
            {session.location}
          </div>
          {session.coach && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-zinc-500" />
              Coach: {session.coach}
            </div>
          )}
        </div>
        {session.description && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
            {session.description}
          </p>
        )}
        <p className="mt-4 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
          View details →
        </p>
      </Card>
    </Link>
  );
}

function CalendarEventCard({ event }: { event: WhatsOnCalendarEvent }) {
  const { dateLabel, timeLabel } = formatEventDateTime(
    event.startDate.toISOString(),
    event.endDate?.toISOString() ?? null,
  );
  const typeStyle = getEventTypeStyle(event.type);
  const feeLabel =
    event.type === "TOURNAMENT" ? "tournament fee" : "session fee";

  return (
    <Link href={eventDetailPath(event.id)} className="group block h-full">
      <Card className="motion-hover-lift h-full overflow-hidden p-0 group-hover:border-jackals-red/40">
        <div className={cn("h-1", typeStyle.dot)} aria-hidden />
        <div className="p-6">
          <div className="mb-3 flex items-start justify-between gap-2">
            <CardTitle>{event.title}</CardTitle>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                typeStyle.badge,
              )}
            >
              {getEventTypeLabel(event.type)}
            </span>
          </div>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
              {dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
              {timeLabel}
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-500" />
                {event.location}
              </div>
            )}
          </div>
          {event.sessionFee != null && (
            <p className="mt-3 text-sm font-medium text-zinc-300">
              {formatEuroFee(event.sessionFee)}{" "}
              <span className="font-normal text-zinc-500">{feeLabel}</span>
            </p>
          )}
          {event.description && (
            <p className="mt-3 line-clamp-2 text-sm text-zinc-500">
              {event.description}
            </p>
          )}
          <p className="mt-4 text-sm font-medium text-jackals-red-light/80 transition-colors group-hover:text-jackals-red-light">
            View details →
          </p>
        </div>
      </Card>
    </Link>
  );
}

function WhatsOnSection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  children,
  hasItems,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
  hasItems: boolean;
}) {
  return (
    <AnimateIn className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-wide text-white">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      </div>
      {!hasItems ? (
        <Card>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </Card>
      ) : (
        children
      )}
    </AnimateIn>
  );
}

export function WhatsOnPage({
  funSessions,
  tournaments,
  skillsClinics,
}: {
  funSessions: FunSession[];
  tournaments: WhatsOnCalendarEvent[];
  skillsClinics: WhatsOnCalendarEvent[];
}) {
  const recurring = funSessions.filter((session) => session.recurring);
  const oneOff = funSessions
    .filter((session) => !session.recurring && session.sessionDate)
    .sort(
      (a, b) =>
        new Date(a.sessionDate!).getTime() - new Date(b.sessionDate!).getTime(),
    );

  const groupedFun = DAYS_OF_WEEK.map((day, index) => ({
    day,
    sessions: recurring.filter((session) => session.dayOfWeek === index),
  })).filter((group) => group.sessions.length > 0);

  const hasAnything =
    funSessions.length > 0 ||
    tournaments.length > 0 ||
    skillsClinics.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="What's On?"
        description="Open sessions, tournaments, and skills clinics you can join — no sign-in required to browse. Pay and register details are on each event page."
      />

      {!hasAnything ? (
        <Card>
          <CardTitle>Nothing scheduled right now</CardTitle>
          <CardDescription>
            Check back soon, or browse the full calendar for everything coming up.
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-12">
          <WhatsOnSection
            title="Fun sessions"
            description="Weekly social volleyball — pay the session fee and register on ReClub."
            emptyTitle="No fun sessions scheduled"
            emptyDescription="Fun session times will be posted here soon."
            hasItems={funSessions.length > 0}
          >
            <div className="space-y-8">
              {groupedFun.map(({ day, sessions }) => (
                <div key={day}>
                  <h3 className="mb-4 text-lg font-semibold text-jackals-red-light">
                    {day}
                  </h3>
                  <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => (
                      <FunSessionCard key={session.id} session={session} />
                    ))}
                  </StaggerIn>
                </div>
              ))}
              {oneOff.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-jackals-red-light">
                    Special sessions
                  </h3>
                  <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {oneOff.map((session) => (
                      <FunSessionCard key={session.id} session={session} />
                    ))}
                  </StaggerIn>
                </div>
              )}
            </div>
          </WhatsOnSection>

          <WhatsOnSection
            title="Tournaments"
            description="Register your team on ReClub, then pay the entry fee by bank transfer."
            emptyTitle="No tournaments scheduled"
            emptyDescription="Tournament dates will appear here when announced."
            hasItems={tournaments.length > 0}
          >
            <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </StaggerIn>
          </WhatsOnSection>

          <WhatsOnSection
            title="Skills clinics"
            description="Focused coaching sessions — pay on ReClub and register for your spot."
            emptyTitle="No skills clinics scheduled"
            emptyDescription="Clinic dates will appear here when announced."
            hasItems={skillsClinics.length > 0}
          >
            <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillsClinics.map((event) => (
                <CalendarEventCard key={event.id} event={event} />
              ))}
            </StaggerIn>
          </WhatsOnSection>
        </div>
      )}
    </PageContainer>
  );
}
