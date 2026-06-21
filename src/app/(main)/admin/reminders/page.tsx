import { prisma } from "@/lib/prisma";
import { RemindersManager } from "@/components/admin/RemindersManager";

export const metadata = { title: "Admin · Reminders" };

export default async function AdminRemindersPage() {
  const reminders = await prisma.eventReminder.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, title: true, startDate: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = reminders.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    event: { ...r.event, startDate: r.event.startDate.toISOString() },
  }));

  return <RemindersManager initialReminders={serialized} />;
}
