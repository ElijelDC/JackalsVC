"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { EventFiltersToolbar } from "@/components/events/EventFiltersToolbar";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  EventSourceFilter,
  filterEvents,
  getEventMonthFilterOptions,
  getEventTypeLabel,
} from "@/lib/event-filters";
import { SESSION_CATEGORIES, SESSION_MANAGER_CONFIG } from "@/lib/training-utils";
import type { TrainingTeam } from "@/lib/training-teams-config";
import {
  MANUAL_EVENT_TYPES,
  normalizeManualEventType,
  type ManualEventType,
} from "@/lib/events-config";
import {
  isOpenReclubEvent,
  savesClinicPaymentFields,
  savesTournamentPaymentFields,
} from "@/lib/event-reclub";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type EventItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
  trainingSessionId: string | null;
  trainingOccurrenceDate: string | null;
  occurrenceCustomized?: boolean;
  hasOccurrenceOverride?: boolean;
  coach?: string | null;
  attendanceUrl?: string | null;
  paymentUrl?: string | null;
  sessionFee?: number | null;
  reclubUsername?: string | null;
  clubIban?: string | null;
  seriesAttendanceUrl?: string | null;
  seriesPaymentUrl?: string | null;
  sessionDescription?: string | null;
  sessionCategory?: string | null;
  trainingTeamKey?: string | null;
};

const EVENT_TYPES = MANUAL_EVENT_TYPES;

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "TOURNAMENT" as ManualEventType,
  location: "",
  coach: "",
  attendanceUrl: "",
  paymentUrl: "",
  sessionFee: "40",
  reclubUsername: "JackalsVC",
  clubIban: "IE29 AIBK 9311 5212 3456 78",
};

export function EventsManager({
  initialEvents,
  trainingSquads,
}: {
  initialEvents: EventItem[];
  trainingSquads: TrainingTeam[];
}) {
  const router = useRouter();
  const [events, setEvents] = useSyncedListState(initialEvents);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTrainingOccurrence, setEditingTrainingOccurrence] =
    useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState<EventSourceFilter>("all");
  const [monthFilter, setMonthFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");

  const squadNameByKey = useMemo(
    () => new Map(trainingSquads.map((squad) => [squad.key, squad.name])),
    [trainingSquads],
  );

  const monthOptions = useMemo(
    () => getEventMonthFilterOptions(events),
    [events],
  );

  const filteredEvents = useMemo(
    () =>
      filterEvents(events, {
        search,
        type: typeFilter,
        source: sourceFilter,
        month: monthFilter,
        trainingTeamKey: teamFilter,
      }),
    [events, search, typeFilter, sourceFilter, monthFilter, teamFilter],
  );

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setSourceFilter("all");
    setMonthFilter("");
    setTeamFilter("");
  };

  const filtersActive =
    Boolean(search.trim()) ||
    Boolean(typeFilter) ||
    sourceFilter !== "all" ||
    Boolean(monthFilter) ||
    Boolean(teamFilter);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setEditingTrainingOccurrence(false);
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
          trainingOccurrenceDate: e.trainingOccurrenceDate
            ? new Date(e.trainingOccurrenceDate).toISOString()
            : null,
        })),
      );
    }
  }, [setEvents]);

  const startEdit = (event: EventItem) => {
    beginAdminEdit(() => {
      setEditingId(event.id);
      setEditingTrainingOccurrence(Boolean(event.trainingSessionId));
      setForm({
        title: event.title,
        description: event.sessionDescription ?? "",
        startDate: toDatetimeLocal(event.startDate),
        endDate: toDatetimeLocal(event.endDate),
        type: normalizeManualEventType(event),
        location: event.location ?? "",
        coach: event.coach ?? "",
        attendanceUrl: event.hasOccurrenceOverride
          ? (event.attendanceUrl ?? "")
          : (event.seriesAttendanceUrl ?? event.attendanceUrl ?? ""),
        paymentUrl: event.hasOccurrenceOverride
          ? (event.paymentUrl ?? "")
          : (event.seriesPaymentUrl ?? event.paymentUrl ?? ""),
        sessionFee:
          event.sessionFee != null
            ? String(event.sessionFee)
            : event.type === "TOURNAMENT"
              ? "40"
              : "15",
        reclubUsername: event.reclubUsername ?? "JackalsVC",
        clubIban: event.clubIban ?? "IE29 AIBK 9311 5212 3456 78",
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const occurrencePayload = {
      title: form.title,
      description: form.description || undefined,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      location: form.location || undefined,
      coach: form.coach || undefined,
      attendanceUrl: form.attendanceUrl.trim() ? form.attendanceUrl.trim() : null,
      paymentUrl: form.paymentUrl.trim() ? form.paymentUrl.trim() : null,
    };

    const manualPayload = {
      ...occurrencePayload,
      type: form.type,
      ...(savesClinicPaymentFields(form.type)
        ? {
            paymentUrl: form.paymentUrl.trim() || undefined,
            sessionFee: form.sessionFee.trim()
              ? Number(form.sessionFee)
              : undefined,
            reclubUsername: form.reclubUsername.trim() || undefined,
          }
        : {}),
      ...(savesTournamentPaymentFields(form.type)
        ? {
            sessionFee: form.sessionFee.trim()
              ? Number(form.sessionFee)
              : undefined,
            clubIban: form.clubIban.trim() || undefined,
          }
        : {}),
    };

    const result = editingId
      ? await apiPut(
          `/api/admin/events/${editingId}`,
          editingTrainingOccurrence ? occurrencePayload : manualPayload,
        )
      : await apiPost("/api/admin/events", manualPayload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(
      editingTrainingOccurrence
        ? "Training occurrence updated."
        : editingId
          ? "Event updated."
          : "Event added.",
    );
    resetForm();
    await loadEvents();
    router.refresh();
  };

  const handleDelete = async (event: EventItem) => {
    const prompt = event.trainingSessionId
      ? "Cancel this training session on this date only? Other sessions in the series will stay scheduled."
      : "Delete this event?";

    if (!confirm(prompt)) return;

    setDeletingId(event.id);
    const result = await apiDelete(`/api/admin/events/${event.id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === event.id) resetForm();
    await loadEvents();
    router.refresh();
  };

  return (
    <AdminSection
      title="Calendar events"
      description="Calendar events including auto-synced training sessions. Edit a single training date here, or change the full recurring schedule under Weekly training."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new event"
        title={
          editingTrainingOccurrence
            ? "Edit this training occurrence"
            : editingId
              ? "Edit event"
              : "Add new event"
        }
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add event"}
        loading={loading}
      >
        {editingTrainingOccurrence && (
          <p className="rounded border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            Changes apply to this date only. To update every session in the
            series, use{" "}
            <a
              href={
                events.find((e) => e.id === editingId)?.sessionCategory ===
                SESSION_CATEGORIES.FUN
                  ? SESSION_MANAGER_CONFIG.FUN.adminPath
                  : SESSION_MANAGER_CONFIG.WEEKLY.adminPath
              }
              className="font-medium text-jackals-red-light hover:text-jackals-red"
            >
              {events.find((e) => e.id === editingId)?.sessionCategory ===
              SESSION_CATEGORIES.FUN
                ? "Fun sessions"
                : "Weekly training"}
            </a>
            .
          </p>
        )}

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
          {!editingTrainingOccurrence && (
            <div>
              <Label htmlFor="event-type">Type</Label>
              <Select
                id="event-type"
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as ManualEventType,
                  })
                }
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {getEventTypeLabel(type)}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className={editingTrainingOccurrence ? "sm:col-span-2" : ""}>
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
          {!editingTrainingOccurrence && isOpenReclubEvent(form.type) && (
            <div className="sm:col-span-2">
              <Label htmlFor="event-attendanceUrl">
                {form.type === "TOURNAMENT"
                  ? "Register team on ReClub link"
                  : "Reclub link (optional)"}
              </Label>
              <Input
                id="event-attendanceUrl"
                type="url"
                value={form.attendanceUrl}
                onChange={(e) =>
                  setForm({ ...form, attendanceUrl: e.target.value })
                }
                placeholder="https://reclub.co/..."
              />
            </div>
          )}
          {!editingTrainingOccurrence && savesClinicPaymentFields(form.type) && (
            <>
              <div>
                <Label htmlFor="event-sessionFee">Session fee (EUR)</Label>
                <Input
                  id="event-sessionFee"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.sessionFee}
                  onChange={(e) =>
                    setForm({ ...form, sessionFee: e.target.value })
                  }
                  placeholder="15"
                  required
                />
              </div>
              <div>
                <Label htmlFor="event-reclubUsername">
                  ReClub username (for payment reference)
                </Label>
                <Input
                  id="event-reclubUsername"
                  value={form.reclubUsername}
                  onChange={(e) =>
                    setForm({ ...form, reclubUsername: e.target.value })
                  }
                  placeholder="e.g. JackalsVC"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="event-paymentUrl">Payment link</Label>
                <Input
                  id="event-paymentUrl"
                  type="url"
                  value={form.paymentUrl}
                  onChange={(e) =>
                    setForm({ ...form, paymentUrl: e.target.value })
                  }
                  placeholder="https://..."
                  required
                />
              </div>
            </>
          )}
          {!editingTrainingOccurrence &&
            savesTournamentPaymentFields(form.type) && (
              <>
                <div>
                  <Label htmlFor="event-tournamentFee">
                    Tournament fee (EUR)
                  </Label>
                  <Input
                    id="event-tournamentFee"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.sessionFee}
                    onChange={(e) =>
                      setForm({ ...form, sessionFee: e.target.value })
                    }
                    placeholder="40"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="event-clubIban">Club IBAN</Label>
                  <Input
                    id="event-clubIban"
                    value={form.clubIban}
                    onChange={(e) =>
                      setForm({ ...form, clubIban: e.target.value })
                    }
                    placeholder="IE29 AIBK 9311 5212 3456 78"
                    required
                  />
                </div>
              </>
            )}
          {editingTrainingOccurrence && (
            <>
              <div>
                <Label htmlFor="event-coach">Coach (optional)</Label>
                <Input
                  id="event-coach"
                  value={form.coach}
                  onChange={(e) => setForm({ ...form, coach: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="event-attendanceUrl">
                  Reclub / attendance link (optional)
                </Label>
                <Input
                  id="event-attendanceUrl"
                  type="url"
                  value={form.attendanceUrl}
                  onChange={(e) =>
                    setForm({ ...form, attendanceUrl: e.target.value })
                  }
                  placeholder="https://reclub.co/..."
                />
              </div>
              {(form.type as string) === "FUN" && (
                <div>
                  <Label htmlFor="event-paymentUrl">
                    Payment link (optional)
                  </Label>
                  <Input
                    id="event-paymentUrl"
                    type="url"
                    value={form.paymentUrl}
                    onChange={(e) =>
                      setForm({ ...form, paymentUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              )}
            </>
          )}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current events ({filteredEvents.length}
            {filteredEvents.length !== events.length
              ? ` of ${events.length}`
              : ""})
          </h3>
        </div>

        <EventFiltersToolbar
          search={search}
          onSearchChange={setSearch}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          source={sourceFilter}
          onSourceChange={setSourceFilter}
          month={monthFilter}
          onMonthChange={setMonthFilter}
          monthOptions={monthOptions}
          trainingTeamKey={teamFilter}
          onTrainingTeamKeyChange={setTeamFilter}
          trainingSquads={trainingSquads}
          showSource
          showMonth
          showTeam
          onClear={filtersActive ? clearFilters : undefined}
          searchPlaceholder="Search title, location, description…"
        />

        {filteredEvents.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {filtersActive
              ? "No events match your filters."
              : "No events yet."}
          </p>
        ) : (
          filteredEvents.map((event) => (
            <AdminListItem
              key={event.id}
              title={event.title}
              subtitle={`${format(new Date(event.startDate), "d MMM yyyy HH:mm")} · ${getEventTypeLabel(event.type)}${event.trainingTeamKey ? ` · ${squadNameByKey.get(event.trainingTeamKey) ?? event.trainingTeamKey}` : ""}${event.location ? ` · ${event.location}` : ""}`}
              note={
                event.trainingSessionId
                  ? `${event.type === "FUN" ? "Fun session" : "Recurring training"}${event.occurrenceCustomized ? " · this date customized" : ""}`
                  : undefined
              }
              secondaryHref={
                event.trainingSessionId
                  ? event.sessionCategory === SESSION_CATEGORIES.FUN
                    ? SESSION_MANAGER_CONFIG.FUN.adminPath
                    : SESSION_MANAGER_CONFIG.WEEKLY.adminPath
                  : undefined
              }
              secondaryLabel={
                event.trainingSessionId ? "Edit full series →" : undefined
              }
              onEdit={() => startEdit(event as EventItem)}
              onDelete={() => handleDelete(event as EventItem)}
              deleting={deletingId === event.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
