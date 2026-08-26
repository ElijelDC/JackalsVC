"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AdminFormCard,
  AdminInlineEditCard,
} from "@/components/admin/AdminForm";
import { AdminBulkCsvImport } from "@/components/admin/AdminBulkCsvImport";
import { AdminSection } from "@/components/admin/AdminShell";
import { EventFiltersToolbar } from "@/components/events/EventFiltersToolbar";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import {
  DEFAULT_CLUB_IBAN,
  DEFAULT_RECLUB_USERNAME,
} from "@/lib/club-payment-defaults";
import { toDatetimeLocal } from "@/lib/datetime-form";
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
import { TournamentRulesPdfField } from "@/components/admin/TournamentRulesPdfField";
import {
  getTournamentHubForEvent,
  tournamentHubPath,
} from "@/lib/tournament-hub-config";

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
  rulesPdfUrl?: string | null;
  reclubReferenceCode?: string | null;
  seriesAttendanceUrl?: string | null;
  seriesPaymentUrl?: string | null;
  sessionDescription?: string | null;
  sessionCategory?: string | null;
  trainingTeamKey?: string | null;
};

type EventFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: ManualEventType;
  location: string;
  coach: string;
  attendanceUrl: string;
  paymentUrl: string;
  sessionFee: string;
  reclubUsername: string;
  clubIban: string;
  notifyMembers: boolean;
};

const EVENT_TYPES = MANUAL_EVENT_TYPES;

const emptyForm: EventFormState = {
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  type: "TOURNAMENT",
  location: "",
  coach: "",
  attendanceUrl: "",
  paymentUrl: "",
  sessionFee: "40",
  reclubUsername: DEFAULT_RECLUB_USERNAME,
  clubIban: DEFAULT_CLUB_IBAN,
  notifyMembers: true,
};

function formFromEvent(event: EventItem): EventFormState {
  return {
    title: event.title,
    description: event.sessionDescription ?? "",
    startDate: toDatetimeLocal(event.startDate),
    endDate: toDatetimeLocal(event.endDate),
    type: event.trainingSessionId
      ? (event.type as ManualEventType)
      : normalizeManualEventType(event),
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
    reclubUsername: event.reclubUsername ?? DEFAULT_RECLUB_USERNAME,
    clubIban: event.clubIban ?? DEFAULT_CLUB_IBAN,
    notifyMembers: false,
  };
}

function EventFields({
  form,
  setForm,
  idPrefix,
  isTrainingOccurrence,
  editingEvent,
  events,
  setEvents,
  showNotifyMembers,
  loading,
}: {
  form: EventFormState;
  setForm: (next: EventFormState) => void;
  idPrefix: string;
  isTrainingOccurrence?: boolean;
  editingEvent?: EventItem | null;
  events?: EventItem[];
  setEvents?: React.Dispatch<React.SetStateAction<EventItem[]>>;
  showNotifyMembers?: boolean;
  loading?: boolean;
}) {
  const editingId = editingEvent?.id ?? null;

  return (
    <>
      {isTrainingOccurrence && editingEvent && (
        <p className="rounded border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          Changes apply to this date only. To update every session in the
          series, use{" "}
          <a
            href={
              editingEvent.sessionCategory === SESSION_CATEGORIES.FUN
                ? SESSION_MANAGER_CONFIG.FUN.adminPath
                : SESSION_MANAGER_CONFIG.WEEKLY.adminPath
            }
            className="font-medium text-jackals-red-light hover:text-jackals-red"
          >
            {editingEvent.sessionCategory === SESSION_CATEGORIES.FUN
              ? "Fun sessions"
              : "Weekly training"}
          </a>
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-title`}>Title</Label>
          <Input
            id={`${idPrefix}-title`}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        {!isTrainingOccurrence && (
          <div>
            <Label htmlFor={`${idPrefix}-type`}>Type</Label>
            <Select
              id={`${idPrefix}-type`}
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
        <div className={isTrainingOccurrence ? "sm:col-span-2" : ""}>
          <Label htmlFor={`${idPrefix}-location`}>Location (optional)</Label>
          <Input
            id={`${idPrefix}-location`}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-start`}>Start date & time</Label>
          <Input
            id={`${idPrefix}-start`}
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-end`}>End date & time (optional)</Label>
          <Input
            id={`${idPrefix}-end`}
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        {!isTrainingOccurrence && isOpenReclubEvent(form.type) && (
          <div className="sm:col-span-2">
            <Label htmlFor={`${idPrefix}-attendanceUrl`}>
              {form.type === "TOURNAMENT"
                ? "Register team on ReClub link"
                : "Reclub link (optional)"}
            </Label>
            <Input
              id={`${idPrefix}-attendanceUrl`}
              type="url"
              value={form.attendanceUrl}
              onChange={(e) =>
                setForm({ ...form, attendanceUrl: e.target.value })
              }
              placeholder="https://reclub.co/..."
            />
          </div>
        )}
        {!isTrainingOccurrence && savesClinicPaymentFields(form.type) && (
          <>
            <div>
              <Label htmlFor={`${idPrefix}-sessionFee`}>
                Session fee (EUR)
              </Label>
              <Input
                id={`${idPrefix}-sessionFee`}
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
              <Label htmlFor={`${idPrefix}-reclubUsername`}>
                ReClub username (for payment reference)
              </Label>
              <Input
                id={`${idPrefix}-reclubUsername`}
                value={form.reclubUsername}
                onChange={(e) =>
                  setForm({ ...form, reclubUsername: e.target.value })
                }
                placeholder={`e.g. ${DEFAULT_RECLUB_USERNAME}`}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor={`${idPrefix}-paymentUrl`}>Payment link</Label>
              <Input
                id={`${idPrefix}-paymentUrl`}
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
        {!isTrainingOccurrence &&
          savesTournamentPaymentFields(form.type) && (
            <>
              <div>
                <Label htmlFor={`${idPrefix}-tournamentFee`}>
                  Tournament fee (EUR)
                </Label>
                <Input
                  id={`${idPrefix}-tournamentFee`}
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
                <Label htmlFor={`${idPrefix}-clubIban`}>Club IBAN</Label>
                <Input
                  id={`${idPrefix}-clubIban`}
                  value={form.clubIban}
                  onChange={(e) =>
                    setForm({ ...form, clubIban: e.target.value })
                  }
                  placeholder={DEFAULT_CLUB_IBAN}
                  required
                />
              </div>
              {editingId && editingEvent && events && setEvents ? (
                <>
                  <TournamentRulesPdfField
                    eventId={editingId}
                    rulesPdfUrl={editingEvent.rulesPdfUrl ?? null}
                    disabled={loading}
                    onChange={(url) => {
                      setEvents((current) =>
                        current.map((item) =>
                          item.id === editingId
                            ? { ...item, rulesPdfUrl: url }
                            : item,
                        ),
                      );
                    }}
                  />
                  {(() => {
                    const hub = getTournamentHubForEvent(editingEvent);
                    if (!hub) return null;
                    return (
                      <p className="sm:col-span-2 text-xs text-zinc-500">
                        Public schedule page:{" "}
                        <a
                          href={tournamentHubPath(hub.slug)}
                          className="text-jackals-gold hover:underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {tournamentHubPath(hub.slug)}
                        </a>
                      </p>
                    );
                  })()}
                </>
              ) : null}
            </>
          )}
        {isTrainingOccurrence && (
          <>
            <div>
              <Label htmlFor={`${idPrefix}-coach`}>Coach (optional)</Label>
              <Input
                id={`${idPrefix}-coach`}
                value={form.coach}
                onChange={(e) => setForm({ ...form, coach: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor={`${idPrefix}-attendanceUrl`}>
                Reclub / attendance link (optional)
              </Label>
              <Input
                id={`${idPrefix}-attendanceUrl`}
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
                <Label htmlFor={`${idPrefix}-paymentUrl`}>
                  Payment link (optional)
                </Label>
                <Input
                  id={`${idPrefix}-paymentUrl`}
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
          <Label htmlFor={`${idPrefix}-description`}>
            Description (optional)
          </Label>
          <Textarea
            id={`${idPrefix}-description`}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        {showNotifyMembers && (
          <div className="sm:col-span-2">
            <label className="flex items-start gap-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/20 accent-jackals-red"
                checked={form.notifyMembers}
                onChange={(e) =>
                  setForm({ ...form, notifyMembers: e.target.checked })
                }
              />
              <span>
                Email opted-in subscribers about this event
                <span className="mt-0.5 block text-xs text-zinc-500">
                  Sends to everyone who subscribed to event emails (members and
                  guests). Training and payment emails are unaffected.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>
    </>
  );
}

export function EventsManager({
  initialEvents,
  trainingSquads,
}: {
  initialEvents: EventItem[];
  trainingSquads: TrainingTeam[];
}) {
  const router = useRouter();
  const [events, setEvents] = useSyncedListState(initialEvents);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTrainingOccurrence, setEditingTrainingOccurrence] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
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
      }) as EventItem[],
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

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTrainingOccurrence(false);
    setEditForm(emptyForm);
    setEditError(null);
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
    setEditingId(event.id);
    setEditingTrainingOccurrence(Boolean(event.trainingSessionId));
    setEditForm(formFromEvent(event));
    setEditError(null);
    setListError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    setListMessage(null);

    const occurrencePayload = {
      title: createForm.title,
      description: createForm.description || undefined,
      startDate: new Date(createForm.startDate).toISOString(),
      endDate: createForm.endDate
        ? new Date(createForm.endDate).toISOString()
        : undefined,
      location: createForm.location || undefined,
      coach: createForm.coach || undefined,
      attendanceUrl: createForm.attendanceUrl.trim()
        ? createForm.attendanceUrl.trim()
        : null,
      paymentUrl: createForm.paymentUrl.trim()
        ? createForm.paymentUrl.trim()
        : null,
    };

    const manualPayload = {
      ...occurrencePayload,
      type: createForm.type,
      notifyMembers: createForm.notifyMembers,
      ...(savesClinicPaymentFields(createForm.type)
        ? {
            paymentUrl: createForm.paymentUrl.trim() || undefined,
            sessionFee: createForm.sessionFee.trim()
              ? Number(createForm.sessionFee)
              : undefined,
            reclubUsername: createForm.reclubUsername.trim() || undefined,
          }
        : {}),
      ...(savesTournamentPaymentFields(createForm.type)
        ? {
            sessionFee: createForm.sessionFee.trim()
              ? Number(createForm.sessionFee)
              : undefined,
            clubIban: createForm.clubIban.trim() || undefined,
          }
        : {}),
    };

    const result = await apiPost("/api/admin/events", manualPayload);

    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Event added.");
    setCreateForm(emptyForm);
    cancelEdit();
    await loadEvents();
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const occurrencePayload = {
      title: editForm.title,
      description: editForm.description || undefined,
      startDate: new Date(editForm.startDate).toISOString(),
      endDate: editForm.endDate
        ? new Date(editForm.endDate).toISOString()
        : undefined,
      location: editForm.location || undefined,
      coach: editForm.coach || undefined,
      attendanceUrl: editForm.attendanceUrl.trim()
        ? editForm.attendanceUrl.trim()
        : null,
      paymentUrl: editForm.paymentUrl.trim()
        ? editForm.paymentUrl.trim()
        : null,
    };

    const manualPayload = {
      ...occurrencePayload,
      type: editForm.type,
      notifyMembers: editForm.notifyMembers,
      ...(savesClinicPaymentFields(editForm.type)
        ? {
            paymentUrl: editForm.paymentUrl.trim() || undefined,
            sessionFee: editForm.sessionFee.trim()
              ? Number(editForm.sessionFee)
              : undefined,
            reclubUsername: editForm.reclubUsername.trim() || undefined,
          }
        : {}),
      ...(savesTournamentPaymentFields(editForm.type)
        ? {
            sessionFee: editForm.sessionFee.trim()
              ? Number(editForm.sessionFee)
              : undefined,
            clubIban: editForm.clubIban.trim() || undefined,
          }
        : {}),
    };

    const result = await apiPut(
      `/api/admin/events/${editingId}`,
      editingTrainingOccurrence ? occurrencePayload : manualPayload,
    );

    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage(
      editingTrainingOccurrence
        ? "Training occurrence updated."
        : "Event updated.",
    );
    cancelEdit();
    await loadEvents();
    router.refresh();
  };

  const handleDelete = async (event: EventItem) => {
    const prompt = event.trainingSessionId
      ? "Cancel this training session on this date only? Other sessions in the series will stay scheduled."
      : "Delete this event?";

    if (!confirm(prompt)) return;

    setDeletingId(event.id);
    setListError(null);
    const result = await apiDelete(`/api/admin/events/${event.id}`);
    setDeletingId(null);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    if (editingId === event.id) cancelEdit();
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
        title="Add new event"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add event"
        loading={loading && !editingId}
      >
        <EventFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="event-create"
          showNotifyMembers
        />
      </AdminFormCard>

      <AdminBulkCsvImport
        type="events"
        description="Download current tournaments, clinics, and socials, add new rows at the top, then upload. Duplicates are skipped automatically. For training or fun sessions, use Weekly training or Fun sessions instead."
      />

      <div className="space-y-3">
        {listError ? (
          <p className="rounded border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
            {listError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current events ({filteredEvents.length}
            {filteredEvents.length !== events.length
              ? ` of ${events.length}`
              : ""})
          </h3>
        </div>

        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}

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
          filteredEvents.map((event) => {
            const isEditing = editingId === event.id;

            return (
              <AdminInlineEditCard
                key={event.id}
                isEditing={isEditing}
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
                editHeading={
                  event.trainingSessionId
                    ? "Edit this training occurrence"
                    : undefined
                }
                onEdit={() => startEdit(event)}
                onDelete={() => void handleDelete(event)}
                deleting={deletingId === event.id}
                onCancelEdit={cancelEdit}
                onSubmit={(e) => void handleUpdate(e)}
                loading={loading && isEditing}
                error={isEditing ? editError : null}
              >
                <EventFields
                  form={editForm}
                  setForm={setEditForm}
                  idPrefix={`event-edit-${event.id}`}
                  isTrainingOccurrence={editingTrainingOccurrence}
                  editingEvent={event}
                  events={events}
                  setEvents={setEvents}
                  loading={loading && isEditing}
                />
              </AdminInlineEditCard>
            );
          })
        )}
      </div>
    </AdminSection>
  );
}
