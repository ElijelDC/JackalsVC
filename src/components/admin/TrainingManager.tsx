"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
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
};

const emptyForm = {
  title: "",
  dayOfWeek: "2",
  startTime: "18:00",
  endTime: "20:00",
  location: "",
  level: "All Levels",
  description: "",
  coach: "",
  attendanceUrl: "",
};

export function TrainingManager({
  initialSessions,
}: {
  initialSessions: TrainingSession[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
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

  const loadSessions = useCallback(async () => {
    const result = await apiGet<{ sessions: TrainingSession[] }>(
      "/api/admin/training",
    );
    if (result.ok) setSessions(result.data.sessions);
  }, []);

  const startEdit = (session: TrainingSession) => {
    setEditingId(session.id);
    setForm({
      title: session.title,
      dayOfWeek: String(session.dayOfWeek),
      startTime: session.startTime,
      endTime: session.endTime,
      location: session.location,
      level: session.level,
      description: session.description ?? "",
      coach: session.coach ?? "",
      attendanceUrl: session.attendanceUrl ?? "",
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
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      level: form.level,
      description: form.description || undefined,
      coach: form.coach || undefined,
      attendanceUrl: form.attendanceUrl || undefined,
    };

    const result = editingId
      ? await apiPut(`/api/admin/training/${editingId}`, payload)
      : await apiPost("/api/admin/training", payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Training session updated." : "Training session added.");
    resetForm();
    await loadSessions();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this training session?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/training/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    await loadSessions();
    router.refresh();
  };

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  return (
    <AdminSection
      title="Training sessions"
      description="Add, edit, or remove weekly training times. Changes appear on the public Training page immediately."
    >
      <AdminFormCard
        title={editingId ? "Edit session" : "Add new session"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add session"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Session title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Intermediate Training"
              required
            />
          </div>
          <div>
            <Label htmlFor="dayOfWeek">Day</Label>
            <Select
              id="dayOfWeek"
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </Select>
          </div>
          <div>
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
          <div>
            <Label htmlFor="coach">Coach (optional)</Label>
            <Input
              id="coach"
              value={form.coach}
              onChange={(e) => setForm({ ...form, coach: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
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
            <p className="mt-1 text-xs text-zinc-500">
              External Reclub link for attendance. Only members with an active
              paid membership can access this.
            </p>
          </div>
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
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current sessions ({sessions.length})
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-zinc-400">No training sessions yet.</p>
        ) : (
          sessions.map((session) => (
            <AdminListItem
              key={session.id}
              title={session.title}
              subtitle={`${DAYS_OF_WEEK[session.dayOfWeek]} · ${session.startTime}–${session.endTime} · ${session.location} · ${session.level}`}
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
