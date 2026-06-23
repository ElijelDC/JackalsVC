"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
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

const RECURRENCE_OPTIONS = [
  { value: "1", label: "Every week" },
  { value: "2", label: "Every 2 weeks" },
  { value: "4", label: "Every 4 weeks" },
] as const;

function createEmptyForm() {
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

function toFormState(session: TrainingSession) {
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
  };
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [form, setForm] = useState(createEmptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setIsDuplicating(false);
    setError(null);
  };

  const loadSessions = useCallback(async () => {
    const result = await apiGet<{ sessions: TrainingSession[] }>(
      config.apiBasePath,
    );
    if (result.ok) setSessions(result.data.sessions.map(normalizeSession));
  }, [config.apiBasePath, setSessions]);

  const startEdit = (session: TrainingSession) => {
    beginAdminEdit(() => {
      setEditingId(session.id);
      setIsDuplicating(false);
      setForm(toFormState(session));
      setError(null);
      setMessage(null);
    });
  };

  const startDuplicate = (session: TrainingSession) => {
    beginAdminEdit(() => {
      setEditingId(null);
      setIsDuplicating(true);
      const duplicateForm = toFormState(session);
      if (!session.recurring) {
        duplicateForm.sessionDate = "";
      }
      duplicateForm.title = duplicateForm.title.endsWith(" (copy)")
        ? duplicateForm.title
        : `${duplicateForm.title} (copy)`;
      setForm(duplicateForm);
      setError(null);
      setMessage(null);
    });
  };

  const buildPayload = () => {
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
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = buildPayload();

    const result = editingId
      ? await apiPut(`${config.apiBasePath}/${editingId}`, payload)
      : await apiPost(config.apiBasePath, payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(
      editingId ? "Session updated." : "Session added.",
    );
    resetForm();
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

    if (editingId === id) resetForm();
    setSessions((current) => current.filter((session) => session.id !== id));
    await loadSessions();
    router.refresh();
  };

  return (
    <AdminSection
      title={config.sectionTitle}
      description={config.sectionDescription}
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new session"
        title={
          editingId
            ? "Edit session"
            : isDuplicating
              ? "Duplicate session"
              : "Add new session"
        }
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId || isDuplicating ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : config.addLabel}
        loading={loading}
      >
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
              <Label htmlFor="trainingTeamKey">Training squad</Label>
              <Select
                id="trainingTeamKey"
                value={form.trainingTeamKey}
                onChange={(e) => {
                  const team = trainingSquads.find(
                    (entry) => entry.key === e.target.value,
                  );
                  setForm((prev) => ({
                    ...prev,
                    trainingTeamKey: e.target.value,
                    dayOfWeek: team
                      ? String(team.dayOfWeek)
                      : prev.dayOfWeek,
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
                  <Label htmlFor="dayOfWeek">Day</Label>
                  <Select
                    id="dayOfWeek"
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
                  <Label htmlFor="recurrenceWeeks">Repeat</Label>
                  <Select
                    id="recurrenceWeeks"
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
                  <Label htmlFor="recurringFrom">From</Label>
                  <Input
                    id="recurringFrom"
                    type="date"
                    value={form.recurringFrom ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, recurringFrom: e.target.value })
                    }
                    required={form.recurring}
                  />
                </div>
                <div>
                  <Label htmlFor="recurringTo">To</Label>
                  <Input
                    id="recurringTo"
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
                <Label htmlFor="sessionDate">Session date</Label>
                <Input
                  id="sessionDate"
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Intermediate Training"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Sports Hall A"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="level">Level</Label>
            <Input
              id="level"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              placeholder="Beginner, Intermediate, Advanced..."
              required
            />
          </div>

          <div>
            <Label htmlFor="startTime">Start time</Label>
            <Input
              id="startTime"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="endTime">End time</Label>
            <Input
              id="endTime"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="coach">Coach (optional)</Label>
            <Input
              id="coach"
              value={form.coach}
              onChange={(e) => setForm({ ...form, coach: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="attendanceUrl">Reclub / attendance link (optional)</Label>
            <Input
              id="attendanceUrl"
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
              <Label htmlFor="reclubUsername">
                ReClub username (for payment reference)
              </Label>
              <Input
                id="reclubUsername"
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
              <Label htmlFor="sessionFee">Session fee (EUR)</Label>
              <Input
                id="sessionFee"
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
              <Label htmlFor="paymentUrl">Payment link (optional)</Label>
              <Input
                id="paymentUrl"
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="mb-8">
        <AdminBulkCsvImport type={config.bulkImportType} />
      </div>

      <div className="space-y-3">
        {listError && (
          <p className="rounded border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
            {listError}
          </p>
        )}
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
            <AdminListItem
              key={session.id}
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
              onDelete={() => handleDelete(session.id)}
              deleting={deletingId === session.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
