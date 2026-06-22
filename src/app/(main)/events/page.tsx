import { Suspense } from "react";
import { auth } from "@/auth";
import { EventsPage } from "@/components/events/EventsPage";
import { getPublicEvents } from "@/lib/public-events";
import { getWhatsOnPageData } from "@/lib/whats-on";

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

  const [whatsOnData, calendarEvents] = await Promise.all([
    getWhatsOnPageData(),
    getPublicEvents(isLoggedIn, session?.user?.id),
  ]);

  return (
    <Suspense>
      <EventsPage
        {...whatsOnData}
        calendarEvents={calendarEvents}
        isLoggedIn={isLoggedIn}
        initialView={view === "calendar" ? "calendar" : "list"}
      />
    </Suspense>
  );
}
