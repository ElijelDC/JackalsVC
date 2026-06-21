import { auth } from "@/auth";
import { redirectToCalendarEventAttendance } from "@/lib/event-attend";

export default async function CalendarEventAttendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  await redirectToCalendarEventAttendance(id, Boolean(session?.user));
}
