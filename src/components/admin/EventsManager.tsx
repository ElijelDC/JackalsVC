"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
};

const EVENT_TYPES = ["TRAINING", "TOURNAMENT", "SOCIAL", "MEETING"] as const;

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "TRAINING" as (typeof EVENT_TYPES)[number],
  location: "",
};

export function EventsManager({ initialEvents }: { initialEvents: EventItem[] }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadEvents = useCallback(async () => {
    const result = await apiGet<{ events: EventItem[] }>("/api/admin/events");
    if (result.ok) {
      setEvents(
        result.data.events.map((e) => ({
          ...e,
          startDate: new Date(e.startDate).toISOString(),
          endDate: e.endDate ? new Date(e.endDate).toISOString() : null,
        })),
      );
    }
  }, []);

  const startEdit = (event: EventItem) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? "",
      startDate: toDatetimeLocal(event.startDate),
      endDate: toDatetimeLocal(event.endDate),
      type: event.type as (typeof EVENT_TYPES)[number],
      location: event.location ?? "",
    });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      type: form.type,
      location: form.location || undefined,
    };

    const result = editingId
      ? await apiPut(`/api/admin/events/${editingId}`, payload)
      : await apiPost("/api/admin/events", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Event updated." : "Event added.");
    resetForm();
    await loadEvents();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/events/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadEvents();
    router.refresh();
  };

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  return (
    <AdminSection
      title="Events"
      description="Manage calendar events shown on the public Events page."
    >
      <AdminFormCard
        title={editingId ? "Edit event" : "Add new event"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add event"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="event-type">Type</Label>
            <Select
              id="event-type"
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as (typeof EVENT_TYPES)[number],
                })
              }
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="event-location">Location (optional)</Label>
            <Input
              id="event-location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="event-start">Start date & time</Label>
            <Input
              id="event-start"
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="event-end">End date & time (optional)</Label>
            <Input
              id="event-end"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="event-description">Description (optional)</Label>
            <Textarea
              id="event-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current events ({events.length})
        </h3>
        {events.map((event) => (
          <AdminListItem
            key={event.id}
            title={event.title}
            subtitle={`${format(new Date(event.startDate), "d MMM yyyy HH:mm")} · ${event.type}${event.location ? ` · ${event.location}` : ""}`}
            onEdit={() => startEdit(event)}
            onDelete={() => handleDelete(event.id)}
            deleting={deletingId === event.id}
          />
        ))}
      </div>
    </AdminSection>
  );
}
