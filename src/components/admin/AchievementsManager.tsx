"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AchievementImageField } from "@/components/admin/AchievementImageField";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/InputFields";
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

const emptyForm = {
  title: "",
  season: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  type: "TOURNAMENT" as (typeof ACHIEVEMENT_TYPES)[number],
};

export function AchievementsManager({
  initialAchievements,
}: {
  initialAchievements: AchievementItem[];
}) {
  const router = useRouter();
  const [achievements, setAchievements] = useSyncedListState(initialAchievements);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadAchievements = useCallback(async () => {
    const result = await apiGet<{ achievements: AchievementItem[] }>(
      "/api/admin/achievements",
    );
    if (result.ok) setAchievements(result.data.achievements);
  }, [setAchievements]);

  const startEdit = (achievement: AchievementItem) => {
    beginAdminEdit(() => {
      setEditingId(achievement.id);
      setForm({
        title: achievement.title,
        season: achievement.season,
        description: achievement.description,
        imageUrl: achievement.imageUrl ?? "",
        sortOrder: achievement.sortOrder,
        type: (achievement.type as (typeof ACHIEVEMENT_TYPES)[number]) ?? "TOURNAMENT",
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
      title: form.title,
      season: form.season,
      description: form.description,
      imageUrl: form.imageUrl || undefined,
      sortOrder: form.sortOrder,
      type: form.type,
    };

    const result = editingId
      ? await apiPut(`/api/admin/achievements/${editingId}`, payload)
      : await apiPost("/api/admin/achievements", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Achievement updated." : "Achievement added.");
    resetForm();
    await loadAchievements();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this achievement?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/achievements/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
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
        title={editingId ? "Edit achievement" : "Add achievement"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add achievement"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="achievement-season">Season</Label>
            <Input
              id="achievement-season"
              value={form.season}
              onChange={(event) =>
                setForm({ ...form, season: event.target.value })
              }
              placeholder="2024/25"
              required
            />
          </div>
          <div>
            <Label htmlFor="achievement-type">Type</Label>
            <Select
              id="achievement-type"
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
          <div>
            <Label htmlFor="achievement-sort">Sort order</Label>
            <Input
              id="achievement-sort"
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
            <Label htmlFor="achievement-title">Title</Label>
            <Input
              id="achievement-title"
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
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
            <Label htmlFor="achievement-description">Description</Label>
            <Textarea
              id="achievement-description"
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
            />
          </div>
        </div>
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
        {filteredAchievements.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No achievements match your search."
              : "No achievements yet."}
          </p>
        ) : (
          filteredAchievements.map((achievement) => (
          <AdminListItem
            key={achievement.id}
            title={achievement.title}
            subtitle={`${achievement.season} · ${achievement.type === "LEAGUE" ? "League" : "Tournament"}${achievement.imageUrl ? " · Image attached" : ""}`}
            onEdit={() => startEdit(achievement)}
            onDelete={() => handleDelete(achievement.id)}
            deleting={deletingId === achievement.id}
          />
          ))
        )}
      </div>
    </AdminSection>
  );
}
