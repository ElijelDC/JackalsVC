import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/CalendarView";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata = {
  title: "Calendar",
};

export default async function CalendarPage() {
  const session = await auth();

  const [events, reminders] = await Promise.all([
    prisma.event.findMany({ orderBy: { startDate: "asc" } }),
    session?.user?.id
      ? prisma.eventReminder.findMany({
          where: { userId: session.user.id },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const serializedEvents = events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
  }));

  return (
    <PageContainer>
      <PageHeader
        title="Events Calendar"
        description="Browse club events and set personal reminders. Sign in to save reminders to your account."
      />
      <CalendarView
        events={serializedEvents}
        reminderIds={reminders.map((r) => r.eventId)}
      />
    </PageContainer>
  );
}
