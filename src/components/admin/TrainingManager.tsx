"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import {
  defaultRecurringFrom,
  defaultRecurringTo,
  formatRecurrenceLabel,
  SESSION_CATEGORIES,
  type SessionManagerConfig,
} from "@/lib/training-utils";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { DAYS_OF_WEEK } from "@/lib/utils";

type TrainingSession = {
  id: string;
  title: string;
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
}: {
  initialSessions: TrainingSession[];
  config: SessionManagerConfig;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(createEmptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(createEmptyForm());
    setEditingId(null);
    setError(null);
  };

  const loadSessions = useCallback(async () => {
    const result = await apiGet<{ sessions: TrainingSession[] }>(
      config.apiBasePath,
    );
    if (result.ok) setSessions(result.data.sessions.map(normalizeSession));
  }, [config.apiBasePath]);

  const startEdit = (session: TrainingSession) => {
    setEditingId(session.id);
    setForm(toFormState(session));
    setError(null);
    setMessage(null);
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

  useEffect(() => {
    setSessions(initialSessions.map(normalizeSession));
  }, [initialSessions]);

  return (
    <AdminSection
      title={config.sectionTitle}
      description={config.sectionDescription}
    >
      <AdminFormCard
        title={editingId ? "Edit session" : "Add new session"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
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

      <div className="space-y-3">
        {listError && (
          <p className="rounded border border-jackals-red/30 bg-jackals-red/10 px-4 py-3 text-sm text-jackals-red-light">
            {listError}
          </p>
        )}
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current sessions ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-400">{config.emptyListMessage}</p>
        ) : (
          sessions.map((session) => (
            <AdminListItem
              key={session.id}
              title={session.title}
              subtitle={`${formatRecurrenceLabel(
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
              onDelete={() => handleDelete(session.id)}
              deleting={deletingId === session.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
