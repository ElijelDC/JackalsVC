"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type TeamItem = {
  id: string;
  name: string;
  level: string;
  description: string;
  details: string | null;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  level: "",
  description: "",
  details: "",
  sortOrder: 0,
};

export function TeamsManager({ initialTeams }: { initialTeams: TeamItem[] }) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
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

  const loadTeams = useCallback(async () => {
    const result = await apiGet<{ teams: TeamItem[] }>("/api/admin/teams");
    if (result.ok) setTeams(result.data.teams);
  }, []);

  const startEdit = (team: TeamItem) => {
    setEditingId(team.id);
    setForm({
      name: team.name,
      level: team.level,
      description: team.description,
      details: team.details ?? "",
      sortOrder: team.sortOrder,
    });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name,
      level: form.level,
      description: form.description,
      details: form.details || undefined,
      sortOrder: form.sortOrder,
    };

    const result = editingId
      ? await apiPut(`/api/admin/teams/${editingId}`, payload)
      : await apiPost("/api/admin/teams", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Team updated." : "Team added.");
    resetForm();
    await loadTeams();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/teams/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadTeams();
    router.refresh();
  };

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  return (
    <AdminSection
      title="Our teams"
      description="Manage squads shown on the public Our Teams page."
    >
      <AdminFormCard
        title={editingId ? "Edit team" : "Add team"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add team"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="team-level">Level label</Label>
            <Input
              id="team-level"
              value={form.level}
              onChange={(event) =>
                setForm({ ...form, level: event.target.value })
              }
              placeholder="Regional league"
              required
            />
          </div>
          <div>
            <Label htmlFor="team-sort">Sort order</Label>
            <Input
              id="team-sort"
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
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              rows={4}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="team-details">Extended details (optional)</Label>
            <Textarea
              id="team-details"
              rows={3}
              value={form.details}
              onChange={(event) =>
                setForm({ ...form, details: event.target.value })
              }
              placeholder="Shown on the team detail page"
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current teams ({teams.length})
        </h3>
        {teams.map((team) => (
          <AdminListItem
            key={team.id}
            title={team.name}
            subtitle={`${team.level} · order ${team.sortOrder}`}
            secondaryHref={`/admin/teams/${team.id}`}
            secondaryLabel="Manage roster →"
            onEdit={() => startEdit(team)}
            onDelete={() => handleDelete(team.id)}
            deleting={deletingId === team.id}
          />
        ))}
      </div>
    </AdminSection>
  );
}
