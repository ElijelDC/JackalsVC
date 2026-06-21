import { auth } from "@/auth";
import { CalendarView } from "@/components/calendar/CalendarView";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { getPublicEvents } from "@/lib/public-events";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Calendar",
};

export default async function CalendarPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const [events, reminders] = await Promise.all([
    getPublicEvents(isLoggedIn),
    session?.user?.id
      ? prisma.eventReminder.findMany({
          where: { userId: session.user.id },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Events Calendar"
        description="Browse tournaments, skills clinics, and fun sessions. Add events to your calendar, or sign in to save club reminders."
      />
      <CalendarView
        events={events}
        isLoggedIn={isLoggedIn}
        reminderIds={reminders.map((r) => r.eventId)}
      />
    </PageContainer>
  );
}
