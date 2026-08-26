"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import {
  AdminFormCard,
  AdminInlineEditCard,
} from "@/components/admin/AdminForm";
import { AchievementImageField } from "@/components/admin/AchievementImageField";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type AchievementItem = {
  id: string;
  title: string;
  season: string;
  description: string;
  imageUrl: string | null;
  sortOrder: number;
  type: string;
};

const ACHIEVEMENT_TYPES = ["LEAGUE", "TOURNAMENT"] as const;

type AchievementFormState = {
  title: string;
  season: string;
  description: string;
  imageUrl: string;
  position: number;
  type: (typeof ACHIEVEMENT_TYPES)[number];
};

const emptyFormBase = {
  title: "",
  season: "",
  description: "",
  imageUrl: "",
  type: "TOURNAMENT" as (typeof ACHIEVEMENT_TYPES)[number],
};

function AchievementFields({
  form,
  setForm,
  idPrefix,
  loading,
}: {
  form: AchievementFormState;
  setForm: (next: AchievementFormState) => void;
  idPrefix: string;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${idPrefix}-season`}>Season</Label>
        <Input
          id={`${idPrefix}-season`}
          value={form.season}
          onChange={(event) =>
            setForm({ ...form, season: event.target.value })
          }
          placeholder="2024/25"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-type`}>Type</Label>
        <Select
          id={`${idPrefix}-type`}
          value={form.type}
          onChange={(event) =>
            setForm({
              ...form,
              type: event.target.value as (typeof ACHIEVEMENT_TYPES)[number],
            })
          }
        >
          {ACHIEVEMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "LEAGUE" ? "League title" : "Tournament"}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <AchievementImageField
          imageUrl={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
          disabled={loading}
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={5}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          required
        />
      </div>
      <div className="sm:col-span-2 sm:max-w-xs">
        <Label htmlFor={`${idPrefix}-position`}>Position</Label>
        <Input
          id={`${idPrefix}-position`}
          type="number"
          min={1}
          value={form.position}
          onChange={(event) =>
            setForm({
              ...form,
              position: Math.max(1, Number(event.target.value) || 1),
            })
          }
        />
      </div>
    </div>
  );
}

export function AchievementsManager({
  initialAchievements,
}: {
  initialAchievements: AchievementItem[];
}) {
  const router = useRouter();
  const [achievements, setAchievements] = useSyncedListState(initialAchievements);
  const [createForm, setCreateForm] = useState<AchievementFormState>({
    ...emptyFormBase,
    position: initialAchievements.length + 1,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AchievementFormState>({
    ...emptyFormBase,
    position: 1,
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredAchievements = useMemo(
    () =>
      achievements.filter((achievement) =>
        matchesAdminSearch(
          search,
          achievement.title,
          achievement.season,
          achievement.description,
          achievement.type === "LEAGUE" ? "League" : "Tournament",
        ),
      ),
    [achievements, search],
  );

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const loadAchievements = useCallback(async () => {
    const result = await apiGet<{ achievements: AchievementItem[] }>(
      "/api/admin/achievements",
    );
    if (result.ok) setAchievements(result.data.achievements);
  }, [setAchievements]);

  const startEdit = (achievement: AchievementItem) => {
    setEditingId(achievement.id);
    setEditForm({
      title: achievement.title,
      season: achievement.season,
      description: achievement.description,
      imageUrl: achievement.imageUrl ?? "",
      position: achievement.sortOrder + 1,
      type:
        (achievement.type as (typeof ACHIEVEMENT_TYPES)[number]) ??
        "TOURNAMENT",
    });
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const payloadFrom = (form: AchievementFormState) => ({
    title: form.title,
    season: form.season,
    description: form.description,
    imageUrl: form.imageUrl || undefined,
    sortOrder: Math.max(0, form.position - 1),
    type: form.type,
  });

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);

    const result = await apiPost(
      "/api/admin/achievements",
      payloadFrom(createForm),
    );

    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Achievement added.");
    setCreateForm({
      ...emptyFormBase,
      position: achievements.length + 2,
    });
    cancelEdit();
    await loadAchievements();
    router.refresh();
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `/api/admin/achievements/${editingId}`,
      payloadFrom(editForm),
    );

    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Achievement updated.");
    cancelEdit();
    await loadAchievements();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this achievement?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/achievements/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setListMessage("Achievement deleted.");
    await loadAchievements();
    router.refresh();
  };

  return (
    <AdminSection
      title="Club achievements"
      description="Manage achievements shown on the public Club Achievements page."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add achievement"
        title="Add achievement"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add achievement"
        loading={loading && !editingId}
      >
        <AchievementFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="achievement-create"
          loading={loading && !editingId}
        />
      </AdminFormCard>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current achievements ({filteredAchievements.length}
            {search.trim() ? ` of ${achievements.length}` : ""})
          </h3>
          <div className="w-full sm:max-w-xs">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search title, season…"
            />
          </div>
        </div>
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        {filteredAchievements.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No achievements match your search."
              : "No achievements yet."}
          </p>
        ) : (
          filteredAchievements.map((achievement) => (
            <AdminInlineEditCard
              key={achievement.id}
              isEditing={editingId === achievement.id}
              title={achievement.title}
              subtitle={`${achievement.season} · ${achievement.type === "LEAGUE" ? "League" : "Tournament"}${achievement.imageUrl ? " · Image attached" : ""}`}
              onEdit={() => startEdit(achievement)}
              onDelete={() => void handleDelete(achievement.id)}
              deleting={deletingId === achievement.id}
              onCancelEdit={cancelEdit}
              onSubmit={(e) => void handleUpdate(e)}
              loading={loading && editingId === achievement.id}
              error={editingId === achievement.id ? editError : null}
            >
              <AchievementFields
                form={editForm}
                setForm={setEditForm}
                idPrefix={`achievement-edit-${achievement.id}`}
                loading={loading && editingId === achievement.id}
              />
            </AdminInlineEditCard>
          ))
        )}
      </div>
    </AdminSection>
  );
}
