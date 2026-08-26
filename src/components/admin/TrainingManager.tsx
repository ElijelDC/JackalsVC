"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AdminFormCard,
  AdminInlineEditCard,
  beginAdminEdit,
} from "@/components/admin/AdminForm";
import { AdminBulkCsvImport } from "@/components/admin/AdminBulkCsvImport";
import { AdminSection } from "@/components/admin/AdminShell";
import { SquadTeamFilter } from "@/components/admin/SquadTeamFilter";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import {
  defaultRecurringFrom,
  defaultRecurringTo,
  formatRecurrenceLabel,
  SESSION_CATEGORIES,
  type SessionManagerConfig,
} from "@/lib/training-utils";
import type { TrainingTeam } from "@/lib/training-teams-config";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { DAYS_OF_WEEK } from "@/lib/utils";

type TrainingSession = {
  id: string;
  title: string;
  trainingTeamKey: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description: string | null;
  coach: string | null;
  attendanceUrl: string | null;
  paymentUrl: string | null;
  reclubUsername: string | null;
  sessionFee: number | null;
  recurring: boolean;
  recurrenceWeeks: number;
  recurringFrom: string | null;
  recurringTo: string | null;
  sessionDate: string | null;
};

type SessionFormState = {
  title: string;
  trainingTeamKey: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  location: string;
  level: string;
  description: string;
  coach: string;
  attendanceUrl: string;
  paymentUrl: string;
  reclubUsername: string;
  sessionFee: string;
  recurring: boolean;
  recurrenceWeeks: string;
  recurringFrom: string;
  recurringTo: string;
  sessionDate: string;
  notifyMembers: boolean;
};

const RECURRENCE_OPTIONS = [
  { value: "1", label: "Every week" },
  { value: "2", label: "Every 2 weeks" },
  { value: "4", label: "Every 4 weeks" },
] as const;

function createEmptyForm(): SessionFormState {
  return {
    title: "",
    trainingTeamKey: "",
    dayOfWeek: "2",
    startTime: "18:00",
    endTime: "20:00",
    location: "",
    level: "All Levels",
    description: "",
    coach: "",
    attendanceUrl: "",
    paymentUrl: "",
    reclubUsername: "",
    sessionFee: "10",
    recurring: true,
    recurrenceWeeks: "1",
    recurringFrom: defaultRecurringFrom(),
    recurringTo: defaultRecurringTo(),
    sessionDate: "",
    notifyMembers: true,
  };
}

function normalizeSession(session: TrainingSession): TrainingSession {
  return {
    ...session,
    trainingTeamKey: session.trainingTeamKey ?? null,
    recurring: session.recurring ?? true,
    recurrenceWeeks: session.recurrenceWeeks ?? 1,
    recurringFrom: session.recurringFrom ?? null,
    recurringTo: session.recurringTo ?? null,
    sessionDate: session.sessionDate ?? null,
  };
}

function toFormState(session: TrainingSession): SessionFormState {
  const normalized = normalizeSession(session);
  return {
    title: normalized.title,
    trainingTeamKey: normalized.trainingTeamKey ?? "",
    dayOfWeek: String(normalized.dayOfWeek),
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    location: normalized.location,
    level: normalized.level,
    description: normalized.description ?? "",
    coach: normalized.coach ?? "",
    attendanceUrl: normalized.attendanceUrl ?? "",
    paymentUrl: normalized.paymentUrl ?? "",
    reclubUsername: normalized.reclubUsername ?? "",
    sessionFee:
      normalized.sessionFee != null ? String(normalized.sessionFee) : "10",
    recurring: normalized.recurring,
    recurrenceWeeks: String(normalized.recurrenceWeeks),
    recurringFrom: normalized.recurringFrom
      ? format(new Date(normalized.recurringFrom), "yyyy-MM-dd")
      : defaultRecurringFrom(),
    recurringTo: normalized.recurringTo
      ? format(new Date(normalized.recurringTo), "yyyy-MM-dd")
      : defaultRecurringTo(),
    sessionDate: normalized.sessionDate
      ? format(new Date(normalized.sessionDate), "yyyy-MM-dd")
      : "",
    notifyMembers: true,
  };
}

function SessionFields({
  form,
  setForm,
  idPrefix,
  config,
  trainingSquads,
  showNotifyMembers,
}: {
  form: SessionFormState;
  setForm: (
    next: SessionFormState | ((prev: SessionFormState) => SessionFormState),
  ) => void;
  idPrefix: string;
  config: SessionManagerConfig;
  trainingSquads: TrainingTeam[];
  showNotifyMembers?: boolean;
}) {
  return (
    <>
      <p className="rounded border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
        Changes apply to the whole recurring series. To edit a single session
        date, use{" "}
        <a
          href="/admin/events"
          className="font-medium text-jackals-red-light hover:text-jackals-red"
        >
          Calendar
        </a>
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {config.category === SESSION_CATEGORIES.WEEKLY && (
          <div className="sm:col-span-2">
            <Label htmlFor={`${idPrefix}-trainingTeamKey`}>Training squad</Label>
            <Select
              id={`${idPrefix}-trainingTeamKey`}
              value={form.trainingTeamKey}
              onChange={(e) => {
                const team = trainingSquads.find(
                  (entry) => entry.key === e.target.value,
                );
                setForm((prev) => ({
                  ...prev,
                  trainingTeamKey: e.target.value,
                  dayOfWeek: team ? String(team.dayOfWeek) : prev.dayOfWeek,
                  level: team?.name ?? prev.level,
                  title: team ? `${team.name} Training` : prev.title,
                }));
              }}
            >
              <option value="">Select squad</option>
              {trainingSquads.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="sm:col-span-2 rounded border border-white/10 bg-jackals-inset p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-white">
            <Checkbox
              checked={form.recurring ?? false}
              onChange={(e) => {
                const recurring = e.target.checked;
                setForm((prev) => ({
                  ...prev,
                  recurring,
                  recurringFrom:
                    recurring && !prev.recurringFrom
                      ? defaultRecurringFrom()
                      : prev.recurringFrom ?? "",
                  recurringTo:
                    recurring && !prev.recurringTo
                      ? defaultRecurringTo()
                      : prev.recurringTo ?? "",
                }));
              }}
            />
            Recurring session
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            {form.recurring
              ? "Repeats between the from and to dates on the chosen schedule."
              : "A single session on a specific date — appears once on the calendar."}
          </p>

          {form.recurring ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${idPrefix}-dayOfWeek`}>Day</Label>
                <Select
                  id={`${idPrefix}-dayOfWeek`}
                  value={form.dayOfWeek}
                  onChange={(e) =>
                    setForm({ ...form, dayOfWeek: e.target.value })
                  }
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor={`${idPrefix}-recurrenceWeeks`}>Repeat</Label>
                <Select
                  id={`${idPrefix}-recurrenceWeeks`}
                  value={form.recurrenceWeeks}
                  onChange={(e) =>
                    setForm({ ...form, recurrenceWeeks: e.target.value })
                  }
                >
                  {RECURRENCE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor={`${idPrefix}-recurringFrom`}>From</Label>
                <Input
                  id={`${idPrefix}-recurringFrom`}
                  type="date"
                  value={form.recurringFrom ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, recurringFrom: e.target.value })
                  }
                  required={form.recurring}
                />
              </div>
              <div>
                <Label htmlFor={`${idPrefix}-recurringTo`}>To</Label>
                <Input
                  id={`${idPrefix}-recurringTo`}
                  type="date"
                  value={form.recurringTo ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, recurringTo: e.target.value })
                  }
                  required={form.recurring}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <Label htmlFor={`${idPrefix}-sessionDate`}>Session date</Label>
              <Input
                id={`${idPrefix}-sessionDate`}
                type="date"
                value={form.sessionDate ?? ""}
                onChange={(e) =>
                  setForm({ ...form, sessionDate: e.target.value })
                }
                required={!form.recurring}
              />
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-title`}>Title</Label>
          <Input
            id={`${idPrefix}-title`}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Intermediate Training"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-location`}>Location</Label>
          <Input
            id={`${idPrefix}-location`}
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Sports Hall A"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-level`}>Level</Label>
          <Input
            id={`${idPrefix}-level`}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            placeholder="Beginner, Intermediate, Advanced..."
            required
          />
        </div>

        <div>
          <Label htmlFor={`${idPrefix}-startTime`}>Start time</Label>
          <Input
            id={`${idPrefix}-startTime`}
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-endTime`}>End time</Label>
          <Input
            id={`${idPrefix}-endTime`}
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
        </div>

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
        {config.category === SESSION_CATEGORIES.FUN && (
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
              placeholder="e.g. JackalsVC"
            />
          </div>
        )}
        {config.category === SESSION_CATEGORIES.FUN && (
          <div>
            <Label htmlFor={`${idPrefix}-sessionFee`}>Session fee (EUR)</Label>
            <Input
              id={`${idPrefix}-sessionFee`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.sessionFee}
              onChange={(e) =>
                setForm({ ...form, sessionFee: e.target.value })
              }
              placeholder="10"
              required
            />
          </div>
        )}
        {config.category === SESSION_CATEGORIES.FUN && (
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
                checked={form.notifyMembers ?? true}
                onChange={(e) =>
                  setForm({ ...form, notifyMembers: e.target.checked })
                }
              />
              <span>
                Email opted-in subscribers about this fun session
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

export function TrainingManager({
  initialSessions,
  config,
  trainingSquads = [],
}: {
  initialSessions: TrainingSession[];
  config: SessionManagerConfig;
  trainingSquads?: TrainingTeam[];
}) {
  const router = useRouter();
  const normalizedInitialSessions = useMemo(
    () => initialSessions.map(normalizeSession),
    [initialSessions],
  );
  const [sessions, setSessions] = useSyncedListState(normalizedInitialSessions);
  const [createForm, setCreateForm] = useState(createEmptyForm);
  const [editForm, setEditForm] = useState(createEmptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState("");
  const [search, setSearch] = useState("");

  const showTeamFilter = config.category === SESSION_CATEGORIES.WEEKLY;

  const squadNameByKey = useMemo(
    () => new Map(trainingSquads.map((squad) => [squad.key, squad.name])),
    [trainingSquads],
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (showTeamFilter && teamFilter && session.trainingTeamKey !== teamFilter) {
        return false;
      }

      return matchesAdminSearch(
        search,
        session.title,
        session.location,
        session.level,
        session.coach ?? "",
        session.description ?? "",
        squadNameByKey.get(session.trainingTeamKey ?? "") ?? "",
      );
    });
  }, [sessions, showTeamFilter, teamFilter, search, squadNameByKey]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(createEmptyForm());
    setEditError(null);
  };

  const resetCreateForm = () => {
    setCreateForm(createEmptyForm());
    setIsDuplicating(false);
    setCreateError(null);
  };

  const loadSessions = useCallback(async () => {
    const result = await apiGet<{ sessions: TrainingSession[] }>(
      config.apiBasePath,
    );
    if (result.ok) setSessions(result.data.sessions.map(normalizeSession));
  }, [config.apiBasePath, setSessions]);

  const startEdit = (session: TrainingSession) => {
    setEditingId(session.id);
    setEditForm(toFormState(session));
    setEditError(null);
    setListError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const startDuplicate = (session: TrainingSession) => {
    beginAdminEdit(() => {
      cancelEdit();
      setIsDuplicating(true);
      const duplicateForm = toFormState(session);
      if (!session.recurring) {
        duplicateForm.sessionDate = "";
      }
      duplicateForm.title = duplicateForm.title.endsWith(" (copy)")
        ? duplicateForm.title
        : `${duplicateForm.title} (copy)`;
      setCreateForm(duplicateForm);
      setCreateError(null);
      setCreateMessage(null);
      setListMessage(null);
    });
  };

  const buildPayload = (form: SessionFormState, isCreate: boolean) => {
    const recurring = form.recurring;
    const sessionDate = form.sessionDate || undefined;
    const dayOfWeek = recurring
      ? Number(form.dayOfWeek)
      : sessionDate
        ? new Date(sessionDate).getDay()
        : Number(form.dayOfWeek);

    return {
      title: form.title,
      trainingTeamKey:
        config.category === SESSION_CATEGORIES.WEEKLY
          ? form.trainingTeamKey || undefined
          : undefined,
      dayOfWeek,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      level: form.level,
      description: form.description || undefined,
      coach: form.coach || undefined,
      attendanceUrl: form.attendanceUrl || undefined,
      paymentUrl:
        config.category === SESSION_CATEGORIES.FUN
          ? form.paymentUrl || undefined
          : undefined,
      reclubUsername:
        config.category === SESSION_CATEGORIES.FUN
          ? form.reclubUsername || undefined
          : undefined,
      sessionFee:
        config.category === SESSION_CATEGORIES.FUN && form.sessionFee.trim()
          ? Number(form.sessionFee)
          : undefined,
      recurring,
      recurrenceWeeks: recurring ? Number(form.recurrenceWeeks) : 1,
      recurringFrom: recurring ? form.recurringFrom : undefined,
      recurringTo: recurring ? form.recurringTo : undefined,
      sessionDate: recurring ? undefined : sessionDate,
      ...(config.category === SESSION_CATEGORIES.FUN && isCreate
        ? { notifyMembers: form.notifyMembers ?? true }
        : {}),
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    setListMessage(null);

    const result = await apiPost(
      config.apiBasePath,
      buildPayload(createForm, true),
    );

    setLoading(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Session added.");
    resetCreateForm();
    cancelEdit();
    await loadSessions();
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `${config.apiBasePath}/${editingId}`,
      buildPayload(editForm, false),
    );

    setLoading(false);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Session updated.");
    cancelEdit();
    await loadSessions();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(config.deleteConfirm)) return;

    setDeletingId(id);
    setListError(null);

    const result = await apiDelete(`${config.apiBasePath}/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setListError(result.error);
      return;
    }

    if (editingId === id) cancelEdit();
    setSessions((current) => current.filter((session) => session.id !== id));
    await loadSessions();
    router.refresh();
  };

  const showNotifyOnCreate = config.category === SESSION_CATEGORIES.FUN;

  return (
    <AdminSection
      title={config.sectionTitle}
      description={config.sectionDescription}
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new session"
        title={isDuplicating ? "Duplicate session" : "Add new session"}
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        onCancel={isDuplicating ? resetCreateForm : undefined}
        submitLabel={config.addLabel}
        loading={loading && !editingId}
      >
        <SessionFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="session-create"
          config={config}
          trainingSquads={trainingSquads}
          showNotifyMembers={showNotifyOnCreate}
        />
      </AdminFormCard>

      <AdminBulkCsvImport type={config.bulkImportType} />

      <div className="space-y-3">
        {listError && (
          <p className="rounded border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
            {listError}
          </p>
        )}
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current sessions ({filteredSessions.length}
            {search.trim() || teamFilter
              ? ` of ${sessions.length}`
              : ""})
          </h3>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <AdminSearchBar
                id="training-search"
                showLabel
                value={search}
                onChange={setSearch}
                placeholder="Title, location, coach…"
              />
            </div>
            {showTeamFilter && (
              <SquadTeamFilter
                id="training-team-filter"
                value={teamFilter}
                onChange={setTeamFilter}
                squads={trainingSquads}
                className="w-full sm:max-w-xs"
              />
            )}
          </div>
        </div>
        {teamFilter && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTeamFilter("")}
            >
              Clear team filter
            </Button>
          </div>
        )}
        {filteredSessions.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No sessions match your search."
              : teamFilter
                ? "No training sessions for this team."
                : config.emptyListMessage}
          </p>
        ) : (
          filteredSessions.map((session) => (
            <AdminInlineEditCard
              key={session.id}
              isEditing={editingId === session.id}
              title={session.title}
              subtitle={`${session.trainingTeamKey ? `${squadNameByKey.get(session.trainingTeamKey) ?? session.trainingTeamKey} · ` : ""}${formatRecurrenceLabel(
                {
                  recurring: session.recurring,
                  dayOfWeek: session.dayOfWeek,
                  recurrenceWeeks: session.recurrenceWeeks,
                  sessionDate: session.sessionDate
                    ? new Date(session.sessionDate)
                    : null,
                  recurringFrom: session.recurringFrom
                    ? new Date(session.recurringFrom)
                    : null,
                  recurringTo: session.recurringTo
                    ? new Date(session.recurringTo)
                    : null,
                },
                { includeDateRange: true },
              )} · ${session.startTime}–${session.endTime} · ${session.location} · ${session.level}`}
              onEdit={() => startEdit(session)}
              onDuplicate={() => startDuplicate(session)}
              onDelete={() => void handleDelete(session.id)}
              deleting={deletingId === session.id}
              onCancelEdit={cancelEdit}
              onSubmit={(e) => void handleUpdate(e)}
              loading={loading && editingId === session.id}
              error={editingId === session.id ? editError : null}
            >
              <SessionFields
                form={editForm}
                setForm={setEditForm}
                idPrefix={`session-edit-${session.id}`}
                config={config}
                trainingSquads={trainingSquads}
              />
            </AdminInlineEditCard>
          ))
        )}
      </div>
    </AdminSection>
  );
}
