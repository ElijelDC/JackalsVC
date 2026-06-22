import { getAdminEventsPayload } from "@/lib/admin-events";
import { getTrainingSquads } from "@/lib/training-squads";
import { EventsManager } from "@/components/admin/EventsManager";

export const metadata = {
  title: "Admin · Events",
};

export default async function AdminEventsPage() {
  const [serialized, trainingSquads] = await Promise.all([
    getAdminEventsPayload(),
    getTrainingSquads({ includeInactive: true }),
  ]);
  return (
    <EventsManager initialEvents={serialized} trainingSquads={trainingSquads} />
  );
}
