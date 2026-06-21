import type { WhatsOnCalendarEvent } from "@/lib/whats-on";
import { groupSessionsByDay } from "@/lib/training-utils";
import type { TrainingSessionCardData } from "@/types/training-session";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { EventListCard } from "@/components/events/EventListCard";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { SessionCard } from "@/components/training/SessionCard";

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
                      <SessionCard
                        key={session.id}
                        session={session}
                        detailBasePath="/fun-sessions"
                      />
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
                      <SessionCard
                        key={session.id}
                        session={session}
                        detailBasePath="/fun-sessions"
                      />
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
                <EventListCard
                  key={event.id}
                  event={calendarEventToCard(event)}
                  cta="text"
                />
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
                <EventListCard
                  key={event.id}
                  event={calendarEventToCard(event)}
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
