"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, Search, Trash2 } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import { FormError } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import { apiDelete, apiGet } from "@/lib/client-api";
import { cn } from "@/lib/utils";

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
  const [reminders, setReminders] = useSyncedListState(initialReminders);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reminders;
    return reminders.filter((reminder) => {
      const haystack = [
        reminder.user.name,
        reminder.user.email,
        reminder.event.title,
        reminder.event.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [reminders, search]);

  const loadReminders = useCallback(async () => {
    const result = await apiGet<{ reminders: Reminder[] }>(
      "/api/admin/reminders",
    );
    if (result.ok) setReminders(result.data.reminders);
  }, [setReminders]);

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

  return (
    <AdminSection
      title="Event reminders"
      description="Members get reminders automatically when they sign up for training. Remove entries here if needed."
    >
      <FormError message={error} />

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search member, email, event…"
            className="pl-9"
          />
        </div>

        <p className="text-xs text-zinc-500">
          {filtered.length} shown
          {filtered.length !== reminders.length ? ` of ${reminders.length}` : ""}
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="font-semibold text-white">No matching reminders</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col />
                  <col className="w-[28%]" />
                  <col className="w-[7rem]" />
                  <col className="w-[3rem]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5 font-medium">Member</th>
                    <th className="px-2 py-2.5 font-medium">Event</th>
                    <th className="px-2 py-2.5 font-medium">Date</th>
                    <th className="px-2 py-2.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filtered.map((reminder) => {
                    const expanded = expandedId === reminder.id;
                    return (
                      <Fragment key={reminder.id}>
                        <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : reminder.id)
                              }
                              className="group flex min-w-0 items-center gap-1.5 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                  expanded && "rotate-180",
                                )}
                              />
                              <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                                {reminder.user.name}
                              </span>
                            </button>
                          </td>
                          <td className="truncate px-2 py-2 text-zinc-400">
                            {reminder.event.title}
                          </td>
                          <td className="px-2 py-2 text-xs text-zinc-400">
                            {format(new Date(reminder.event.startDate), "d MMM yyyy")}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              title="Remove reminder"
                              disabled={deletingId === reminder.id}
                              onClick={() => void handleDelete(reminder.id)}
                              className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-black/20">
                            <td colSpan={4} className="px-4 py-3 text-sm text-zinc-400">
                              <p>
                                <span className="text-zinc-500">Email:</span>{" "}
                                {reminder.user.email}
                              </p>
                              <p className="mt-1">
                                <span className="text-zinc-500">Type:</span>{" "}
                                {reminder.event.type}
                              </p>
                              <p className="mt-1">
                                <span className="text-zinc-500">Set:</span>{" "}
                                {format(new Date(reminder.createdAt), "d MMM yyyy HH:mm")}
                              </p>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 lg:hidden">
              {filtered.map((reminder) => {
                const expanded = expandedId === reminder.id;
                return (
                  <article
                    key={reminder.id}
                    className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : reminder.id)
                        }
                        className="group flex min-w-0 flex-1 items-start gap-1.5 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                            expanded && "rotate-180",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-white">
                            {reminder.user.name}
                          </p>
                          <p className="truncate text-sm text-zinc-500">
                            {reminder.event.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            {format(new Date(reminder.event.startDate), "d MMM yyyy")}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        title="Remove reminder"
                        disabled={deletingId === reminder.id}
                        onClick={() => void handleDelete(reminder.id)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {expanded ? (
                      <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-sm text-zinc-400">
                        <p>{reminder.user.email}</p>
                        <p>
                          {reminder.event.type} · set{" "}
                          {format(new Date(reminder.createdAt), "d MMM yyyy")}
                        </p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminSection>
  );
}
