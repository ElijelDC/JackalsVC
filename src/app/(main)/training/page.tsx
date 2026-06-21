import { format } from "date-fns";
import { Clock, CalendarDays, MapPin, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAttendanceAccess } from "@/lib/membership";
import { formatRecurrenceLabel } from "@/lib/training-utils";
import { DAYS_OF_WEEK } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";

export const metadata = {
  title: "Training Times",
};

type Session = Awaited<
  ReturnType<typeof prisma.trainingSession.findMany>
>[number];

function SessionCard({
  session,
  showRecurrence,
  canAccessAttendance,
}: {
  session: Session;
  showRecurrence?: string;
  canAccessAttendance: boolean;
}) {
  return (
    <Card>
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
        <p className="mt-3 text-sm text-zinc-500">{session.description}</p>
      )}

      {session.attendanceUrl && canAccessAttendance && (
        <AttendanceLink sessionId={session.id} />
      )}
    </Card>
  );
}

export default async function TrainingPage() {
  const [sessions, session] = await Promise.all([
    prisma.trainingSession.findMany({
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    auth(),
  ]);

  const canAccessAttendance = session?.user
    ? await hasAttendanceAccess(session.user)
    : false;

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
      <PageHeader
        title="Training Times"
        description="Weekly recurring sessions and upcoming one-off training. Paid membership is required to register session attendance via Reclub."
      />

      {!hasSessions ? (
        <Card>
          <CardTitle>No sessions scheduled yet</CardTitle>
          <CardDescription>
            Training times will be posted here soon. Check back later.
          </CardDescription>
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
                    canAccessAttendance={canAccessAttendance}
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
                    canAccessAttendance={canAccessAttendance}
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
