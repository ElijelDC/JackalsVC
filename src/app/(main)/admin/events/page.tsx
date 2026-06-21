import { getAdminEventsPayload } from "@/lib/admin-events";
import { EventsManager } from "@/components/admin/EventsManager";

export const metadata = {
  title: "Admin · Events",
};

export default async function AdminEventsPage() {
  const serialized = await getAdminEventsPayload();
  return <EventsManager initialEvents={serialized} />;
}
