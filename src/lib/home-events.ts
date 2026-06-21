import { getPublicEvents } from "@/lib/public-events";
import type { EventListItem } from "@/lib/event-filters";

export async function getHomepageUpcomingEvents(
  isLoggedIn: boolean,
  limit = 3,
): Promise<EventListItem[]> {
  const now = new Date();
  const events = await getPublicEvents(isLoggedIn);
  return events
    .filter((event) => new Date(event.startDate) >= now)
    .slice(0, limit);
}
