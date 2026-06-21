import { auth } from "@/auth";
import { buildIcsContent, createIcsDownloadResponse } from "@/lib/calendar-export";
import { getPublicEvent } from "@/lib/public-events";
import { absoluteSiteUrl, siteUrlFromRequest } from "@/lib/site-url";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const event = await getPublicEvent(id, isLoggedIn);
  const siteUrl = siteUrlFromRequest(request);
  const eventPageUrl = absoluteSiteUrl(siteUrl, `/calendar/${event.id}`);

  const ics = buildIcsContent(
    {
      id: event.id,
      title: event.title,
      description: event.sessionDescription ?? event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
    },
    { eventPageUrl },
  );

  return createIcsDownloadResponse(ics, event.title);
}
