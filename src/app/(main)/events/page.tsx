import { Suspense } from "react";
import { auth } from "@/auth";
import { EventsPage } from "@/components/events/EventsPage";
import { getPublicEvents } from "@/lib/public-events";
import { getEventsPageData } from "@/lib/events-page-data";
import { syncReclubClubUpcomingActivitiesForBrowse } from "@/lib/reclub-sync";
import { pageMetadata, SEO_COPY } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Events",
  description: SEO_COPY.eventsIntro,
  path: "/events",
});

export default async function EventsRoute({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const { view } = await searchParams;

  void syncReclubClubUpcomingActivitiesForBrowse().catch((error) => {
    console.error("Reclub club sync failed:", error);
  });

  const [eventsData, calendarEvents] = await Promise.all([
    getEventsPageData(),
    getPublicEvents(isLoggedIn, session?.user?.id),
  ]);

  return (
    <Suspense>
      <EventsPage
        {...eventsData}
        calendarEvents={calendarEvents}
        isLoggedIn={isLoggedIn}
        initialView={view === "calendar" ? "calendar" : "list"}
      />
    </Suspense>
  );
}
