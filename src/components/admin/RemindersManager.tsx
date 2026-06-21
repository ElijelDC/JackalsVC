"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { apiDelete, apiGet } from "@/lib/client-api";

type Reminder = {
  id: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  event: { id: string; title: string; startDate: string; type: string };
};

export function RemindersManager({
  initialReminders,
}: {
  initialReminders: Reminder[];
}) {
  const router = useRouter();
  const [reminders, setReminders] = useState(initialReminders);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    const result = await apiGet<{ reminders: Reminder[] }>(
      "/api/admin/reminders",
    );
    if (result.ok) setReminders(result.data.reminders);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this event reminder?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/reminders/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadReminders();
    router.refresh();
  };

  useEffect(() => {
    setReminders(initialReminders);
  }, [initialReminders]);

  return (
    <AdminSection
      title="Event reminders"
      description="See which members have set reminders for upcoming events, and remove them if needed."
    >
      {error && <p className="mb-4 text-sm text-jackals-red-light">{error}</p>}

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          All reminders ({reminders.length})
        </h3>
        {reminders.length === 0 ? (
          <p className="text-sm text-zinc-400">No reminders set yet.</p>
        ) : (
          reminders.map((reminder) => (
            <AdminListItem
              key={reminder.id}
              title={`${reminder.user.name} → ${reminder.event.title}`}
              subtitle={`${reminder.user.email} · ${format(new Date(reminder.event.startDate), "d MMM yyyy")} · ${reminder.event.type} · Set ${format(new Date(reminder.createdAt), "d MMM yyyy")}`}
              onDelete={() => handleDelete(reminder.id)}
              deleting={deletingId === reminder.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
