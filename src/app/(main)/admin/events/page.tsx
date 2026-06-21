import { prisma } from "@/lib/prisma";
import { EventsManager } from "@/components/admin/EventsManager";

export const metadata = {
  title: "Admin · Events",
};

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
  });

  const serialized = events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
  }));

  return <EventsManager initialEvents={serialized} />;
}
