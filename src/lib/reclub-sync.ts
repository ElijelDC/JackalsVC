import { startOfDay } from "date-fns";
import { DEFAULT_CLUB_IBAN, DEFAULT_RECLUB_USERNAME } from "@/lib/club-payment-defaults";
import { sendEventNewsletter } from "@/lib/event-newsletter";
import { savesClinicPaymentFields, savesTournamentPaymentFields } from "@/lib/event-reclub";
import { fetchUpcomingReclubClubActivities, resolveReclubGroupId } from "@/lib/reclub-club";
import {
  fetchReclubCompetition,
  type ReclubCompetition,
} from "@/lib/reclub-competition-payload";
import { inferReclubEventType } from "@/lib/reclub-event-type";
import { fetchReclubMeet, type ReclubMeet } from "@/lib/reclub-payload";
import {
  isReclubCompetitionId,
  reclubCompetitionUrl,
  reclubMeetUrl,
} from "@/lib/reclub-config";
import {
  RECLUB_CACHE_TTL_MS,
  withReclubRequestCache,
} from "@/lib/reclub-request-cache";
import { prisma } from "@/lib/prisma";

export type ReclubSyncResult = {
  referenceCode: string;
  action: "created" | "updated" | "deleted" | "skipped";
  eventId?: string;
  reason?: string;
};

function inferEventType(event: { name: string; notes: string | null }) {
  return inferReclubEventType({
    title: event.name,
    description: event.notes,
  });
}

function buildMeetEventData(meet: ReclubMeet) {
  const type = inferEventType(meet);

  return {
    title: meet.name,
    description: meet.notes,
    startDate: meet.startDate,
    endDate: meet.endDate,
    type,
    location: meet.location,
    attendanceUrl: reclubMeetUrl(meet.referenceCode),
    paymentUrl: savesClinicPaymentFields(type) ? meet.paymentUrl : null,
    sessionFee:
      savesClinicPaymentFields(type) || savesTournamentPaymentFields(type)
        ? meet.sessionFee
        : meet.sessionFee,
    reclubUsername:
      savesClinicPaymentFields(type) || type === "FUN"
        ? DEFAULT_RECLUB_USERNAME
        : null,
    reclubReferenceCode: meet.referenceCode,
    trainingSessionId: null,
    trainingOccurrenceDate: null,
    clubIban: savesTournamentPaymentFields(type) ? DEFAULT_CLUB_IBAN : null,
  };
}

function buildCompetitionEventData(competition: ReclubCompetition) {
  const type = inferEventType(competition);

  return {
    title: competition.name,
    description: competition.notes,
    startDate: competition.startDate,
    endDate: competition.endDate,
    type,
    location: competition.location,
    attendanceUrl: reclubCompetitionUrl(
      competition.id,
      competition.accessToken,
    ),
    paymentUrl: savesClinicPaymentFields(type) ? competition.paymentUrl : null,
    sessionFee:
      savesClinicPaymentFields(type) || savesTournamentPaymentFields(type)
        ? competition.sessionFee
        : competition.sessionFee,
    reclubUsername:
      savesClinicPaymentFields(type) || type === "FUN"
        ? DEFAULT_RECLUB_USERNAME
        : null,
    reclubReferenceCode: competition.id,
    trainingSessionId: null,
    trainingOccurrenceDate: null,
    clubIban: savesTournamentPaymentFields(type) ? DEFAULT_CLUB_IBAN : null,
  };
}

export async function syncReclubMeetByReferenceCode(
  referenceCode: string,
  options: { notifyMembers?: boolean } = {},
): Promise<ReclubSyncResult> {
  const code = referenceCode.trim().toUpperCase();
  const meet = await fetchReclubMeet(code);

  if (!meet) {
    return {
      referenceCode: code,
      action: "skipped",
      reason: "Meet not found on Reclub",
    };
  }

  if (meet.isCancelled) {
    const deleted = await prisma.event.deleteMany({
      where: { reclubReferenceCode: code },
    });

    return {
      referenceCode: code,
      action: deleted.count > 0 ? "deleted" : "skipped",
      reason: "Meet cancelled on Reclub",
    };
  }

  if (meet.isPast) {
    return {
      referenceCode: code,
      action: "skipped",
      reason: "Meet already finished on Reclub",
    };
  }

  const data = buildMeetEventData(meet);
  const existing = await prisma.event.findUnique({
    where: { reclubReferenceCode: code },
    select: { id: true },
  });

  if (existing) {
    const event = await prisma.event.update({
      where: { id: existing.id },
      data,
    });

    return {
      referenceCode: code,
      action: "updated",
      eventId: event.id,
    };
  }

  const event = await prisma.event.create({ data });

  if (options.notifyMembers) {
    await sendEventNewsletter(event.id);
  }

  return {
    referenceCode: code,
    action: "created",
    eventId: event.id,
  };
}

export async function syncReclubCompetitionById(
  competitionId: string,
  options: { notifyMembers?: boolean } = {},
): Promise<ReclubSyncResult> {
  const id = competitionId.trim();
  const competition = await fetchReclubCompetition(id);

  if (!competition) {
    return {
      referenceCode: id,
      action: "skipped",
      reason: "Competition not found on Reclub",
    };
  }

  if (competition.isCancelled) {
    const deleted = await prisma.event.deleteMany({
      where: { reclubReferenceCode: id },
    });

    return {
      referenceCode: id,
      action: deleted.count > 0 ? "deleted" : "skipped",
      reason: "Competition cancelled on Reclub",
    };
  }

  if (competition.startDate.getTime() < Date.now()) {
    return {
      referenceCode: id,
      action: "skipped",
      reason: "Competition already started on Reclub",
    };
  }

  const data = buildCompetitionEventData(competition);
  const existing = await prisma.event.findUnique({
    where: { reclubReferenceCode: id },
    select: { id: true },
  });

  if (existing) {
    const event = await prisma.event.update({
      where: { id: existing.id },
      data,
    });

    return {
      referenceCode: id,
      action: "updated",
      eventId: event.id,
    };
  }

  const event = await prisma.event.create({ data });

  if (options.notifyMembers) {
    await sendEventNewsletter(event.id);
  }

  return {
    referenceCode: id,
    action: "created",
    eventId: event.id,
  };
}

export async function syncReclubReferenceOrCompetitionId(
  referenceOrCompetitionId: string,
  options: { notifyMembers?: boolean } = {},
): Promise<ReclubSyncResult> {
  const value = referenceOrCompetitionId.trim();
  if (isReclubCompetitionId(value)) {
    return syncReclubCompetitionById(value, options);
  }

  return syncReclubMeetByReferenceCode(value, options);
}

export async function syncReclubReferenceCodes(
  referenceCodes: string[],
  options: { notifyMembers?: boolean } = {},
) {
  const results: ReclubSyncResult[] = [];

  for (const referenceCode of referenceCodes) {
    results.push(
      await syncReclubReferenceOrCompetitionId(referenceCode, options),
    );
  }

  return results;
}

export async function syncTrackedReclubMeets(options: {
  notifyMembers?: boolean;
  includeStored?: boolean;
  extraCodes?: string[];
} = {}) {
  const codes = new Set<string>(options.extraCodes ?? []);

  if (options.includeStored !== false) {
    const stored = await prisma.event.findMany({
      where: { reclubReferenceCode: { not: null } },
      select: { reclubReferenceCode: true },
    });

    for (const event of stored) {
      if (event.reclubReferenceCode) {
        codes.add(event.reclubReferenceCode);
      }
    }
  }

  return syncReclubReferenceCodes([...codes], options);
}

export type ReclubClubSyncResult = {
  groupId: number | null;
  upcomingCount: number;
  results: ReclubSyncResult[];
};

export async function syncReclubClubUpcomingActivities(
  options: { notifyMembers?: boolean } = {},
): Promise<ReclubClubSyncResult> {
  const groupId = await resolveReclubGroupId();
  if (!groupId) {
    return { groupId: null, upcomingCount: 0, results: [] };
  }

  const upcoming = await fetchUpcomingReclubClubActivities(groupId);
  const syncedKeys = new Set(
    upcoming.map((activity) =>
      activity.kind === "meet"
        ? activity.referenceCode
        : activity.competitionId,
    ),
  );
  const results: ReclubSyncResult[] = [];

  for (const activity of upcoming) {
    if (activity.kind === "meet") {
      results.push(
        await syncReclubMeetByReferenceCode(activity.referenceCode, options),
      );
      continue;
    }

    results.push(
      await syncReclubCompetitionById(activity.competitionId, options),
    );
  }

  const now = new Date();
  const today = startOfDay(now);
  const stored = await prisma.event.findMany({
    where: {
      reclubReferenceCode: { not: null },
      trainingSessionId: null,
      OR: [
        { endDate: { gte: now } },
        { endDate: null, startDate: { gte: today } },
      ],
    },
    select: { reclubReferenceCode: true },
  });

  for (const event of stored) {
    const key = event.reclubReferenceCode;
    if (!key || syncedKeys.has(key)) continue;

    results.push(await syncReclubReferenceOrCompetitionId(key, options));
  }

  return {
    groupId,
    upcomingCount: upcoming.length,
    results,
  };
}

/** Throttled sync for public browse pages — avoids Reclub API stampedes. */
export async function syncReclubClubUpcomingActivitiesForBrowse(): Promise<ReclubClubSyncResult> {
  return withReclubRequestCache(
    "club-sync:browse",
    RECLUB_CACHE_TTL_MS.clubSync,
    () => syncReclubClubUpcomingActivities({ notifyMembers: false }),
  );
}
