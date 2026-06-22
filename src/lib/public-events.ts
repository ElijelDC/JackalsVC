import { notFound } from "next/navigation";
import {
  filterEventsForViewer,
  filterFunSessionsWithinCalendarHorizon,
  MEMBER_ONLY_EVENT_TYPES,
  type EventListItem,
} from "@/lib/event-filters";
import {
  enrichEventRecords,
  serializeEnrichedEvent,
} from "@/lib/event-enrichment";
import { resolveOccurrenceAttendanceUrl, resolveOccurrencePaymentUrl } from "@/lib/training-occurrence";
import { prisma } from "@/lib/prisma";
import { SESSION_CATEGORIES } from "@/lib/training-utils";
import { getTeamTrainingSession, getUserTrainingTeamKey } from "@/lib/training-teams";
import { isOpenReclubEvent } from "@/lib/event-reclub";

export async function getPublicEvents(
  isLoggedIn: boolean,
  userId?: string,
): Promise<EventListItem[]> {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  const enriched = await enrichEventRecords(events);
  let serialized = enriched.map(serializeEnrichedEvent);

  serialized = filterEventsForViewer(serialized, isLoggedIn);

  if (userId) {
    const teamKey = await getUserTrainingTeamKey(userId);
    const teamSession = teamKey ? await getTeamTrainingSession(teamKey) : null;

    serialized = serialized.filter((event) => {
      if (event.type !== "TRAINING") return true;
      if (!teamSession) return false;
      return event.trainingSessionId === teamSession.id;
    });
  }

  return filterFunSessionsWithinCalendarHorizon(serialized);
}

export async function getPublicEvent(
  id: string,
  isLoggedIn: boolean,
): Promise<EventListItem> {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const [enriched] = await enrichEventRecords([event]);
  const serialized = serializeEnrichedEvent(enriched);

  if (
    !isLoggedIn &&
    MEMBER_ONLY_EVENT_TYPES.includes(
      serialized.type as (typeof MEMBER_ONLY_EVENT_TYPES)[number],
    )
  ) {
    notFound();
  }

  return serialized;
}

export function sessionSchedulePath(event: EventListItem) {
  if (!event.trainingSessionId) return null;
  if (event.sessionCategory === SESSION_CATEGORIES.FUN) {
    return `/fun-sessions/${event.trainingSessionId}`;
  }
  if (event.type === "TRAINING") {
    return `/training/session/${event.id}`;
  }
  return null;
}

export async function getEventAttendanceContext(event: EventListItem) {
  if (isOpenReclubEvent(event.type)) {
    return {
      attendanceUrl: event.attendanceUrl ?? null,
      attendanceOccurrenceDate: null as string | null,
      attendBasePath: "/calendar" as string | null,
      openAttendance: true,
      paymentUrl: event.paymentUrl ?? null,
    };
  }

  if (
    !event.trainingSessionId ||
    (event.type !== "TRAINING" && event.type !== "FUN")
  ) {
    return {
      attendanceUrl: null as string | null,
      attendanceOccurrenceDate: null as string | null,
      attendBasePath: null as string | null,
      openAttendance: false,
      paymentUrl: null as string | null,
    };
  }

  const occurrenceDate = event.trainingOccurrenceDate ?? event.startDate;
  const session = await prisma.trainingSession.findUnique({
    where: { id: event.trainingSessionId },
  });

  if (!session) {
    return {
      attendanceUrl: null,
      attendanceOccurrenceDate: null,
      attendBasePath: null,
      openAttendance: false,
      paymentUrl: null,
    };
  }

  const attendanceUrl = await resolveOccurrenceAttendanceUrl(
    event.trainingSessionId,
    new Date(occurrenceDate),
    session.attendanceUrl,
  );

  const attendBasePath =
    event.type === "FUN" ? "/fun-sessions" : "/training";

  return {
    attendanceUrl,
    attendanceOccurrenceDate: occurrenceDate,
    attendBasePath,
    openAttendance: event.type === "FUN",
    paymentUrl: await resolveOccurrencePaymentUrl(
      event.trainingSessionId,
      new Date(occurrenceDate),
      session.paymentUrl,
    ),
  };
}
