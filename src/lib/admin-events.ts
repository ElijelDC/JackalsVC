import { enrichEventRecords, serializeEnrichedEvent } from "@/lib/event-enrichment";
import { prisma } from "@/lib/prisma";

export async function getAdminEventsPayload() {
  const events = await prisma.event.findMany({ orderBy: { startDate: "asc" } });
  const enriched = await enrichEventRecords(events);
  return enriched.map(serializeEnrichedEvent);
}
