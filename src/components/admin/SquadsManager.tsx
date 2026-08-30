"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import {
  AdminFormCard,
  AdminInlineEditCard,
} from "@/components/admin/AdminForm";
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

type SquadFormState = {
  name: string;
  dayOfWeek: string;
  sortOrder: number;
  active: boolean;
};

const emptyForm: SquadFormState = {
  name: "",
  dayOfWeek: "4",
  sortOrder: 0,
  active: true,
};

function SquadFields({
  form,
  setForm,
  idPrefix,
  squadKey,
}: {
  form: SquadFormState;
  setForm: (next: SquadFormState) => void;
  idPrefix: string;
  squadKey?: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>Squad name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Division 2 Mens"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-day`}>Training day</Label>
        <Select
          id={`${idPrefix}-day`}
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
        <Label htmlFor={`${idPrefix}-sort`}>Sort order</Label>
        <Input
          id={`${idPrefix}-sort`}
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
            <span className="block text-sm font-medium text-white">Active</span>
            <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
              Inactive squads are hidden from roster dropdowns but keep existing
              assignments.
            </span>
          </span>
        </label>
      </div>
      {squadKey ? (
        <div className="sm:col-span-2">
          <Label>Squad key</Label>
          <p className="mt-1 font-mono text-sm text-zinc-400">{squadKey}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Internal identifier — cannot be changed after creation.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function SquadsManager({ initialSquads }: { initialSquads: SquadItem[] }) {
  const router = useRouter();
  const [squads, setSquads] = useSyncedListState(initialSquads);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError(null);
  };

  const loadSquads = useCallback(async () => {
    const result = await apiGet<{ squads: SquadItem[] }>(
      "/api/admin/training-squads",
    );
    if (result.ok) setSquads(result.data.squads);
  }, [setSquads]);

  const startEdit = (squad: SquadItem) => {
    setEditingId(squad.id);
    setEditForm({
      name: squad.name,
      dayOfWeek: String(squad.dayOfWeek),
      sortOrder: squad.sortOrder,
      active: squad.active,
    });
    setEditError(null);
    setListMessage(null);
    setListError(null);
    setCreateMessage(null);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    setListError(null);

    const result = await apiPost("/api/admin/training-squads", {
      name: createForm.name,
      dayOfWeek: Number(createForm.dayOfWeek),
      sortOrder: createForm.sortOrder,
      active: createForm.active,
    });

    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Squad added.");
    setCreateForm(emptyForm);
    cancelEdit();
    await loadSquads();
    router.refresh();
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);
    setListError(null);

    const result = await apiPut(`/api/admin/training-squads/${editingId}`, {
      name: editForm.name,
      dayOfWeek: Number(editForm.dayOfWeek),
      sortOrder: editForm.sortOrder,
      active: editForm.active,
    });

    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Squad updated.");
    cancelEdit();
    await loadSquads();
    router.refresh();
  };

  const handleDelete = async (squad: SquadItem) => {
    const usageResult = await apiGet<{
      usage: {
        members: number;
        sessions: number;
        matches: number;
      };
    }>(`/api/admin/training-squads/${squad.id}`, "load squad usage");

    const usage = usageResult.ok ? usageResult.data.usage : null;

    if (usage?.members) {
      setListError(
        `Cannot delete ${squad.name}: ${usage.members} roster member${usage.members === 1 ? "" : "s"} still assigned. Reassign them on the roster first.`,
      );
      return;
    }

    const linkedParts: string[] = [];
    if (usage?.sessions) {
      linkedParts.push(
        `${usage.sessions} training session${usage.sessions === 1 ? "" : "s"}`,
      );
    }
    if (usage?.matches) {
      linkedParts.push(`${usage.matches} match${usage.matches === 1 ? "" : "es"}`);
    }

    const cascadeNote =
      linkedParts.length > 0
        ? `\n\nThis will permanently delete ${linkedParts.join(" and ")} linked to this squad.`
        : "";

    if (
      !confirm(
        `Delete ${squad.name}?${cascadeNote}\n\nThis cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(squad.id);
    setListError(null);
    setListMessage(null);
    const result = await apiDelete(`/api/admin/training-squads/${squad.id}`);
    setDeletingId(null);
    if (!result.ok) {
      setListError(result.error);
      if (editingId === squad.id) setEditError(result.error);
      return;
    }
    if (editingId === squad.id) cancelEdit();
    const deleted = result.data as {
      deletedSessions?: number;
      deletedMatches?: number;
    };
    const removed: string[] = [];
    if (deleted.deletedSessions) {
      removed.push(
        `${deleted.deletedSessions} training session${deleted.deletedSessions === 1 ? "" : "s"}`,
      );
    }
    if (deleted.deletedMatches) {
      removed.push(
        `${deleted.deletedMatches} match${deleted.deletedMatches === 1 ? "" : "es"}`,
      );
    }
    setListMessage(
      removed.length > 0
        ? `Squad deleted (${removed.join(", ")} removed).`
        : "Squad deleted.",
    );
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
        title="Add squad"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add squad"
        loading={loading && !editingId}
      >
        <SquadFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="squad-create"
        />
      </AdminFormCard>

      <div className="mt-6 space-y-3">
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        {listError ? (
          <p className="text-sm text-rose-300">{listError}</p>
        ) : null}
        {squads.map((squad) => (
          <AdminInlineEditCard
            key={squad.id}
            isEditing={editingId === squad.id}
            title={squad.name}
            subtitle={`${DAYS_OF_WEEK[squad.dayOfWeek]} · ${squad.key}`}
            note={
              squad.active
                ? undefined
                : "Inactive — hidden from new assignments"
            }
            onEdit={() => startEdit(squad)}
            onDelete={() => void handleDelete(squad)}
            deleting={deletingId === squad.id}
            onCancelEdit={cancelEdit}
            onSubmit={(e) => void handleUpdate(e)}
            loading={loading && editingId === squad.id}
            error={editingId === squad.id ? editError : null}
          >
            <SquadFields
              form={editForm}
              setForm={setEditForm}
              idPrefix={`squad-edit-${squad.id}`}
              squadKey={squad.key}
            />
          </AdminInlineEditCard>
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
