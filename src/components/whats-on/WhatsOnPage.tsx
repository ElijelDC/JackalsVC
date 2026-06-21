import {
  type WhatsOnCalendarEvent,
  whatsOnEventDetailPath,
  WHATS_ON_SECTIONS,
} from "@/lib/whats-on";
import { groupSessionsByDay } from "@/lib/training-utils";
import type { TrainingSessionCardData } from "@/types/training-session";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { EventListCard } from "@/components/events/EventListCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { SessionCard } from "@/components/training/SessionCard";

function WhatsOnSection({
  id,
  title,
  emptyTitle,
  emptyDescription,
  children,
  hasItems,
}: {
  id?: string;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
  hasItems: boolean;
}) {
  return (
    <AnimateIn className="space-y-4">
      <h2
        id={id}
        className="scroll-mt-28 font-display text-2xl font-semibold tracking-wide text-white"
      >
        {title}
      </h2>
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

function calendarEventToCard(event: WhatsOnCalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    location: event.location,
    description: event.description,
    sessionFee: event.sessionFee,
  };
}

export function WhatsOnPage({
  funSessions,
  tournaments,
  skillsClinics,
}: {
  funSessions: TrainingSessionCardData[];
  tournaments: WhatsOnCalendarEvent[];
  skillsClinics: WhatsOnCalendarEvent[];
}) {
  const { grouped: groupedFun, oneOff } = groupSessionsByDay(funSessions);

  const hasAnything =
    funSessions.length > 0 ||
    tournaments.length > 0 ||
    skillsClinics.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="What's On?"
        description="Available fun sessions, tournaments, and skills clinics you can join in on! Click on each to view more!"
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
            id={WHATS_ON_SECTIONS.funSessions}
            title="Fun sessions"
            emptyTitle="No fun sessions scheduled"
            emptyDescription="Fun session times will be posted here soon."
            hasItems={funSessions.length > 0}
          >
            <div className="space-y-8">
              {groupedFun.map(({ day, sessions }) => (
                <StaggerIn
                  key={day}
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      detailBasePath="/fun-sessions"
                    />
                  ))}
                </StaggerIn>
              ))}
              {oneOff.length > 0 && (
                <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {oneOff.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      detailBasePath="/fun-sessions"
                    />
                  ))}
                </StaggerIn>
              )}
            </div>
          </WhatsOnSection>

          <WhatsOnSection
            id={WHATS_ON_SECTIONS.tournaments}
            title="Tournaments"
            emptyTitle="No tournaments scheduled"
            emptyDescription="Tournament dates will appear here when announced."
            hasItems={tournaments.length > 0}
          >
            <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((event) => (
                <EventListCard
                  key={event.id}
                  event={calendarEventToCard(event)}
                  href={whatsOnEventDetailPath(event.id, "tournaments")}
                  cta="text"
                />
              ))}
            </StaggerIn>
          </WhatsOnSection>

          <WhatsOnSection
            id={WHATS_ON_SECTIONS.skillsClinics}
            title="Skills clinics"
            emptyTitle="No skills clinics scheduled"
            emptyDescription="Clinic dates will appear here when announced."
            hasItems={skillsClinics.length > 0}
          >
            <StaggerIn className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skillsClinics.map((event) => (
                <EventListCard
                  key={event.id}
                  event={calendarEventToCard(event)}
                  href={whatsOnEventDetailPath(event.id, "skillsClinics")}
                  cta="text"
                />
              ))}
            </StaggerIn>
          </WhatsOnSection>
        </div>
      )}
    </PageContainer>
  );
}
