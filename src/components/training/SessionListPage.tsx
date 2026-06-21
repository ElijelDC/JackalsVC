import Link from "next/link";
import { format } from "date-fns";
import { Clock, CalendarDays, MapPin, User } from "lucide-react";
import { formatRecurrenceLabel } from "@/lib/training-utils";
import { DAYS_OF_WEEK } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

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

function SessionCard({
  session,
  showRecurrence,
  detailBasePath,
}: {
  session: Session;
  showRecurrence?: string;
  detailBasePath: string;
}) {
  return (
    <Link
      href={`${detailBasePath}/${session.id}`}
      className="group block h-full"
    >
      <Card className="h-full transition-colors group-hover:border-jackals-red/40 group-hover:bg-jackals-surface">
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

export function SessionListPage({
  sessions,
  detailBasePath,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  sessions: Session[];
  detailBasePath: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const recurring = sessions.filter((s) => s.recurring);
  const oneOff = sessions
    .filter((s) => !s.recurring && s.sessionDate)
    .sort(
      (a, b) =>
        new Date(a.sessionDate!).getTime() - new Date(b.sessionDate!).getTime(),
    );

  const grouped = DAYS_OF_WEEK.map((day, index) => ({
    day,
    sessions: recurring.filter((s) => s.dayOfWeek === index),
  })).filter((g) => g.sessions.length > 0);

  const hasSessions = grouped.length > 0 || oneOff.length > 0;

  return (
    <PageContainer>
      <PageHeader title={title} description={description} />

      {!hasSessions ? (
        <Card>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ day, sessions: daySessions }) => (
            <div key={day}>
              <h2 className="mb-4 text-xl font-semibold text-jackals-red-light">
                {day}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {daySessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    showRecurrence={formatRecurrenceLabel(s)}
                    detailBasePath={detailBasePath}
                  />
                ))}
              </div>
            </div>
          ))}

          {oneOff.length > 0 && (
            <div>
              <h2 className="mb-4 text-xl font-semibold text-jackals-red-light">
                Special sessions
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {oneOff.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    showRecurrence={format(
                      new Date(s.sessionDate!),
                      "EEEE, d MMMM yyyy",
                    )}
                    detailBasePath={detailBasePath}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
