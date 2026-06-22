import { EventsListView } from "@/components/events/EventsListView";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import type { EventsCalendarEvent } from "@/lib/events-config";
import type { TrainingSessionCardData } from "@/types/training-session";

/** @deprecated Use EventsPage at /events */
export function WhatsOnPage({
  funSessions,
  tournaments,
  skillsClinics,
  socials,
}: {
  funSessions: TrainingSessionCardData[];
  tournaments: EventsCalendarEvent[];
  skillsClinics: EventsCalendarEvent[];
  socials: EventsCalendarEvent[];
}) {
  return (
    <PageContainer>
      <PageHeader
        title="Events"
        description="Available fun sessions, tournaments, and skills clinics you can join in on!"
      />
      <EventsListView
        funSessions={funSessions}
        tournaments={tournaments}
        skillsClinics={skillsClinics}
        socials={socials}
      />
    </PageContainer>
  );
}
