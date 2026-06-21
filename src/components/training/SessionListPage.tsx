import Link from "next/link";
import { format } from "date-fns";
import { formatRecurrenceLabel, groupSessionsByDay } from "@/lib/training-utils";
import type { TrainingSessionCardData } from "@/types/training-session";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { SessionCard } from "@/components/training/SessionCard";

export function SessionListPage({
  sessions,
  detailBasePath,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  sessions: TrainingSessionCardData[];
  detailBasePath: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const { grouped, oneOff } = groupSessionsByDay(sessions);
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
            <AnimateIn key={day}>
              <h2 className="mb-4 text-xl font-semibold text-jackals-red-light">
                {day}
              </h2>
              <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {daySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    showRecurrence={formatRecurrenceLabel(session)}
                    detailBasePath={detailBasePath}
                  />
                ))}
              </StaggerIn>
            </AnimateIn>
          ))}

          {oneOff.length > 0 && (
            <AnimateIn>
              <h2 className="mb-4 text-xl font-semibold text-jackals-red-light">
                Special sessions
              </h2>
              <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {oneOff.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    showRecurrence={format(
                      new Date(session.sessionDate!),
                      "EEEE, d MMMM yyyy",
                    )}
                    detailBasePath={detailBasePath}
                  />
                ))}
              </StaggerIn>
            </AnimateIn>
          )}
        </div>
      )}
    </PageContainer>
  );
}
