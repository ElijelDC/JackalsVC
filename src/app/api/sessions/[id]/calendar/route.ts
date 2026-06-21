import { auth } from "@/auth";
import { buildIcsContent, createIcsDownloadResponse } from "@/lib/calendar-export";
import {
  assertSessionCalendarAccess,
  getSessionCalendarExport,
} from "@/lib/session-calendar";
import { getPublicSession } from "@/lib/session-detail";
import { absoluteSiteUrl, siteUrlFromRequest } from "@/lib/site-url";
import { SESSION_CATEGORIES, type SessionCategory } from "@/lib/training-utils";

function parseCategory(value: string | null): SessionCategory | null {
  if (value === SESSION_CATEGORIES.WEEKLY || value === SESSION_CATEGORIES.FUN) {
    return value;
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const category = parseCategory(
    new URL(request.url).searchParams.get("category"),
  );

  if (!category) {
    return new Response("Category required", { status: 400 });
  }

  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  assertSessionCalendarAccess(category, isLoggedIn);

  const trainingSession = await getPublicSession(id, category);
  const calendarExport = await getSessionCalendarExport(trainingSession);

  if (!calendarExport) {
    return new Response("No upcoming session to export", { status: 404 });
  }

  const siteUrl = siteUrlFromRequest(request);
  const sessionPageUrl = absoluteSiteUrl(
    siteUrl,
    `${category === SESSION_CATEGORIES.FUN ? "/fun-sessions" : "/training"}/${trainingSession.id}`,
  );

  const ics = buildIcsContent(
    {
      id: calendarExport.id,
      title: calendarExport.title,
      description: calendarExport.description,
      startDate: calendarExport.startDate,
      endDate: calendarExport.endDate,
      location: calendarExport.location,
    },
    {
      eventPageUrl: sessionPageUrl,
      uid: `${trainingSession.id}-${calendarExport.occurrenceDate}@jackalsvc.com`,
    },
  );

  return createIcsDownloadResponse(ics, calendarExport.title);
}
