import { Suspense } from "react";
import { auth } from "@/auth";
import { EventsPage } from "@/components/events/EventsPage";
import { getPublicEvents } from "@/lib/public-events";
import { getEventsPageData } from "@/lib/events-page-data";

export const metadata = {
  title: "Events",
};

export default async function EventsRoute({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const { view } = await searchParams;

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
