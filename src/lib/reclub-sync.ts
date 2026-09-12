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
  clearReclubRequestCache,
  RECLUB_CACHE_TTL_MS,
  withReclubRequestCache,
  type ReclubFetchOptions,
} from "@/lib/reclub-request-cache";
import { prisma } from "@/lib/prisma";

export type ReclubSyncResult = {
  referenceCode: string;
  action: "created" | "updated" | "deleted" | "skipped";
  eventId?: string;
  reason?: string;
};

type SyncOptions = ReclubFetchOptions & {
  notifyMembers?: boolean;
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

async function upsertReclubEvent(
  referenceCode: string,
  data: ReturnType<typeof buildMeetEventData>,
  options: SyncOptions,
): Promise<ReclubSyncResult> {
  const existing = await prisma.event.findUnique({
    where: { reclubReferenceCode: referenceCode },
    select: { id: true },
  });

  if (existing) {
    const event = await prisma.event.update({
      where: { id: existing.id },
      data,
    });

    return {
      referenceCode,
      action: "updated",
      eventId: event.id,
    };
  }

  const event = await prisma.event.create({ data });

  if (options.notifyMembers) {
    await sendEventNewsletter(event.id);
  }

  return {
    referenceCode,
    action: "created",
    eventId: event.id,
  };
}

export async function syncReclubMeetByReferenceCode(
  referenceCode: string,
  options: SyncOptions = {},
): Promise<ReclubSyncResult> {
  const code = referenceCode.trim().toUpperCase();
  const meet = await fetchReclubMeet(code, {
    forceRefresh: options.forceRefresh,
  });

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

  const data = buildMeetEventData(meet);
  const existing = await prisma.event.findUnique({
    where: { reclubReferenceCode: code },
    select: { id: true },
  });

  // Past meets: update existing rows so reschedules/edits reflect locally,
  // but do not create brand-new past clutter.
  if (meet.isPast && !existing) {
    return {
      referenceCode: code,
      action: "skipped",
      reason: "Meet already finished on Reclub",
    };
  }

  return upsertReclubEvent(code, data, options);
}

export async function syncReclubCompetitionById(
  competitionId: string,
  options: SyncOptions = {},
): Promise<ReclubSyncResult> {
  const id = competitionId.trim();
  const competition = await fetchReclubCompetition(id, {
    forceRefresh: options.forceRefresh,
  });

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

  const data = buildCompetitionEventData(competition);
  const existing = await prisma.event.findUnique({
    where: { reclubReferenceCode: id },
    select: { id: true },
  });

  if (competition.startDate.getTime() < Date.now() && !existing) {
    return {
      referenceCode: id,
      action: "skipped",
      reason: "Competition already started on Reclub",
    };
  }

  return upsertReclubEvent(id, data, options);
}

export async function syncReclubReferenceOrCompetitionId(
  referenceOrCompetitionId: string,
  options: SyncOptions = {},
): Promise<ReclubSyncResult> {
  const value = referenceOrCompetitionId.trim();
  if (isReclubCompetitionId(value)) {
    return syncReclubCompetitionById(value, options);
  }

  return syncReclubMeetByReferenceCode(value, options);
}

export async function syncReclubReferenceCodes(
  referenceCodes: string[],
  options: SyncOptions = {},
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
  forceRefresh?: boolean;
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

  return syncReclubReferenceCodes([...codes], {
    notifyMembers: options.notifyMembers,
    forceRefresh: options.forceRefresh ?? true,
  });
}

export type ReclubClubSyncResult = {
  groupId: number | null;
  upcomingCount: number;
  results: ReclubSyncResult[];
};

export async function syncReclubClubUpcomingActivities(
  options: SyncOptions = {},
): Promise<ReclubClubSyncResult> {
  const forceRefresh = options.forceRefresh ?? true;
  if (forceRefresh) {
    clearReclubRequestCache();
  }

  const groupId = await resolveReclubGroupId();
  if (!groupId) {
    return { groupId: null, upcomingCount: 0, results: [] };
  }

  const upcoming = await fetchUpcomingReclubClubActivities(groupId, {
    forceRefresh,
  });
  const syncedKeys = new Set(
    upcoming.map((activity) =>
      activity.kind === "meet"
        ? activity.referenceCode
        : activity.competitionId,
    ),
  );
  const results: ReclubSyncResult[] = [];
  const syncOptions: SyncOptions = {
    notifyMembers: options.notifyMembers,
    forceRefresh,
  };

  for (const activity of upcoming) {
    if (activity.kind === "meet") {
      results.push(
        await syncReclubMeetByReferenceCode(activity.referenceCode, syncOptions),
      );
      continue;
    }

    results.push(
      await syncReclubCompetitionById(activity.competitionId, syncOptions),
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

    results.push(await syncReclubReferenceOrCompetitionId(key, syncOptions));
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
    () =>
      syncReclubClubUpcomingActivities({
        notifyMembers: false,
        forceRefresh: true,
      }),
  );
}
