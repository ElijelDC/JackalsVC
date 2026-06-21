import { Clock, MapPin, User } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasAttendanceAccess } from "@/lib/membership";
import { DAYS_OF_WEEK } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AttendanceLink } from "@/components/training/AttendanceLink";

export const metadata = {
  title: "Training Times",
};

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

  const grouped = DAYS_OF_WEEK.map((day, index) => ({
    day,
    sessions: sessions.filter((s) => s.dayOfWeek === index),
  })).filter((g) => g.sessions.length > 0);

  return (
    <PageContainer>
      <PageHeader
        title="Training Times"
        description="All sessions are held at the club training hall unless stated otherwise. Arrive 10 minutes early to warm up. Paid membership is required to register session attendance."
      />

      {grouped.length === 0 ? (
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
                {daySessions.map((session) => (
                  <Card key={session.id}>
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <CardTitle>{session.title}</CardTitle>
                      <Badge>{session.level}</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-zinc-400">
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
                      <p className="mt-3 text-sm text-zinc-500">
                        {session.description}
                      </p>
                    )}

                    {session.attendanceUrl && canAccessAttendance && (
                      <AttendanceLink sessionId={session.id} />
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
