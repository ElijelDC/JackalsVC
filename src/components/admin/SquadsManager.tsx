"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox } from "@/components/ui/InputFields";
import { Input, Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { DAYS_OF_WEEK } from "@/lib/utils";

type SquadItem = {
  id: string;
  key: string;
  name: string;
  dayOfWeek: number;
  sortOrder: number;
  active: boolean;
};

const emptyForm = {
  name: "",
  dayOfWeek: "4",
  sortOrder: 0,
  active: true,
};

export function SquadsManager({ initialSquads }: { initialSquads: SquadItem[] }) {
  const router = useRouter();
  const [squads, setSquads] = useSyncedListState(initialSquads);
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

  const loadSquads = useCallback(async () => {
    const result = await apiGet<{ squads: SquadItem[] }>(
      "/api/admin/training-squads",
    );
    if (result.ok) setSquads(result.data.squads);
  }, [setSquads]);

  const startEdit = (squad: SquadItem) => {
    beginAdminEdit(() => {
      setEditingId(squad.id);
      setForm({
        name: squad.name,
        dayOfWeek: String(squad.dayOfWeek),
        sortOrder: squad.sortOrder,
        active: squad.active,
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name,
      dayOfWeek: Number(form.dayOfWeek),
      sortOrder: form.sortOrder,
      active: form.active,
    };

    const result = editingId
      ? await apiPut(`/api/admin/training-squads/${editingId}`, payload)
      : await apiPost("/api/admin/training-squads", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Squad updated." : "Squad added.");
    resetForm();
    await loadSquads();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this squad?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/training-squads/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadSquads();
    router.refresh();
  };

  return (
    <AdminSection
      title="Training squads"
      description="Squads used for roster assignment, weekly training, and matches. Names appear in member dropdowns; training day is shown on member-facing pages."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add squad"
        title={editingId ? "Edit squad" : "Add squad"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add squad"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="squad-name">Squad name</Label>
            <Input
              id="squad-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Division 2 Mens"
              required
            />
          </div>
          <div>
            <Label htmlFor="squad-day">Training day</Label>
            <Select
              id="squad-day"
              value={form.dayOfWeek}
              onChange={(event) =>
                setForm({ ...form, dayOfWeek: event.target.value })
              }
              required
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={String(index)}>
                  {day}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="squad-sort">Sort order</Label>
            <Input
              id="squad-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) =>
                setForm({
                  ...form,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <Checkbox
                checked={form.active}
                onChange={(event) =>
                  setForm({ ...form, active: event.target.checked })
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-white">
                  Active
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                  Inactive squads are hidden from roster dropdowns but keep
                  existing assignments.
                </span>
              </span>
            </label>
          </div>
          {editingId && (
            <div className="sm:col-span-2">
              <Label>Squad key</Label>
              <p className="mt-1 font-mono text-sm text-zinc-400">
                {squads.find((squad) => squad.id === editingId)?.key}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Internal identifier — cannot be changed after creation.
              </p>
            </div>
          )}
        </div>
      </AdminFormCard>

      <div className="mt-6 space-y-3">
        {squads.map((squad) => (
          <AdminListItem
            key={squad.id}
            title={squad.name}
            subtitle={`${DAYS_OF_WEEK[squad.dayOfWeek]} · ${squad.key}`}
            note={squad.active ? undefined : "Inactive — hidden from new assignments"}
            onEdit={() => startEdit(squad)}
            onDelete={() => handleDelete(squad.id)}
            deleting={deletingId === squad.id}
          />
        ))}

        {squads.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            No squads yet. Add your first training squad above.
          </p>
        )}
      </div>
    </AdminSection>
  );
}
