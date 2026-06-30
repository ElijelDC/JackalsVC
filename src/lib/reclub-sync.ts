import { DEFAULT_CLUB_IBAN, DEFAULT_RECLUB_USERNAME } from "@/lib/club-payment-defaults";
import { sendEventNewsletter } from "@/lib/event-newsletter";
import { savesClinicPaymentFields, savesTournamentPaymentFields } from "@/lib/event-reclub";
import { fetchReclubMeet, type ReclubMeet } from "@/lib/reclub-payload";
import { reclubMeetUrl } from "@/lib/reclub-config";
import { prisma } from "@/lib/prisma";

export type ReclubSyncResult = {
  referenceCode: string;
  action: "created" | "updated" | "deleted" | "skipped";
  eventId?: string;
  reason?: string;
};

function inferEventType(meet: ReclubMeet): string {
  const text = `${meet.name} ${meet.notes ?? ""}`.toLowerCase();

  if (/\btournament\b/.test(text)) {
    return "TOURNAMENT";
  }

  if (/\bclinic\b|\bworkshop\b|\bskills?\b/.test(text)) {
    return "SKILLS_CLINIC";
  }

  return "FUN";
}

function buildEventData(meet: ReclubMeet) {
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

  const data = buildEventData(meet);
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

export async function syncReclubReferenceCodes(
  referenceCodes: string[],
  options: { notifyMembers?: boolean } = {},
) {
  const results: ReclubSyncResult[] = [];

  for (const referenceCode of referenceCodes) {
    results.push(await syncReclubMeetByReferenceCode(referenceCode, options));
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
