"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost } from "@/lib/client-api";
import type { TrainingTeam } from "@/lib/training-teams-config";

type TeamItem = {
  id: string;
  name: string;
  level: string;
  description: string;
  details: string | null;
  trainingTeamKey: string | null;
  sortOrder: number;
};

const emptyForm = {
  name: "",
  level: "",
  description: "",
  details: "",
  trainingTeamKey: "",
  sortOrder: 0,
};

export function TeamsManager({
  initialTeams,
  trainingSquads,
}: {
  initialTeams: TeamItem[];
  trainingSquads: TrainingTeam[];
}) {
  const router = useRouter();
  const [teams, setTeams] = useSyncedListState(initialTeams);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        const linkedSquad = trainingSquads.find(
          (squad) => squad.key === team.trainingTeamKey,
        );

        return matchesAdminSearch(
          search,
          team.name,
          team.level,
          team.description,
          linkedSquad?.name ?? "",
        );
      }),
    [teams, search, trainingSquads],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setError(null);
  };

  const loadTeams = useCallback(async () => {
    const result = await apiGet<{ teams: TeamItem[] }>("/api/admin/teams");
    if (result.ok) setTeams(result.data.teams);
  }, [setTeams]);

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
      trainingTeamKey: form.trainingTeamKey || null,
      sortOrder: form.sortOrder,
    };

    const result = await apiPost("/api/admin/teams", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Team added.");
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
    await loadTeams();
    router.refresh();
  };

  return (
    <AdminSection
      title="Our teams"
      description="Add new teams here. Use Manage team on each row to edit details and roster."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add team"
        title="Add team"
        error={error}
        message={message}
        onSubmit={handleSubmit}
        submitLabel="Add team"
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
            <Label htmlFor="team-squad">Linked training squad</Label>
            <Select
              id="team-squad"
              value={form.trainingTeamKey}
              onChange={(event) =>
                setForm({ ...form, trainingTeamKey: event.target.value })
              }
            >
              <option value="">Manual roster only</option>
              {trainingSquads.map((squad) => (
                <option key={squad.key} value={squad.key}>
                  {squad.name}
                </option>
              ))}
            </Select>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current teams ({filteredTeams.length}
            {search.trim() ? ` of ${teams.length}` : ""})
          </h3>
          <div className="w-full sm:max-w-xs">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search name, level, squad…"
            />
          </div>
        </div>
        {filteredTeams.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim() ? "No teams match your search." : "No teams yet."}
          </p>
        ) : (
          filteredTeams.map((team) => {
          const linkedSquad = trainingSquads.find(
            (squad) => squad.key === team.trainingTeamKey,
          );

          return (
          <AdminListItem
            key={team.id}
            title={team.name}
            subtitle={`${team.level} · order ${team.sortOrder}${linkedSquad ? ` · ${linkedSquad.name}` : ""}`}
            actionHref={`/admin/teams/${team.id}`}
            actionLabel="Manage team"
            onDelete={() => handleDelete(team.id)}
            deleting={deletingId === team.id}
          />
          );
        })
        )}
      </div>
    </AdminSection>
  );
}
