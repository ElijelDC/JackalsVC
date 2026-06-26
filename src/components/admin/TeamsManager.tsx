"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
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
  position: 1,
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
  const [form, setForm] = useState({
    ...emptyForm,
    position: initialTeams.length + 1,
  });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamOrder, setTeamOrder] = useState<string[]>(
    initialTeams.map((team) => team.id),
  );
  const [draggingTeamId, setDraggingTeamId] = useState<string | null>(null);

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

  const teamsById = useMemo(
    () => Object.fromEntries(teams.map((team) => [team.id, team])),
    [teams],
  );

  useEffect(() => {
    setTeamOrder((current) => {
      const existing = new Set(teams.map((team) => team.id));
      const kept = current.filter((id) => existing.has(id));
      const missing = teams
        .map((team) => team.id)
        .filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [teams]);

  const visibleTeams = useMemo(() => {
    if (search.trim()) return filteredTeams;
    return teamOrder
      .map((id) => teamsById[id])
      .filter((team): team is TeamItem => Boolean(team));
  }, [search, filteredTeams, teamOrder, teamsById]);

  const hasOrderChanges = useMemo(() => {
    if (search.trim()) return false;
    return teamOrder.some((id, index) => teamsById[id]?.sortOrder !== index);
  }, [search, teamOrder, teamsById]);

  const resetForm = () => {
    setForm({
      ...emptyForm,
      position: teams.length + 1,
    });
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
      sortOrder: Math.max(0, form.position - 1),
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

  const moveTeamBefore = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setTeamOrder((current) => {
      const next = [...current];
      const from = next.indexOf(sourceId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    setError(null);
    setMessage(null);

    for (const [index, id] of teamOrder.entries()) {
      const team = teamsById[id];
      if (!team || team.sortOrder === index) continue;

      const result = await apiPut(
        `/api/admin/teams/${id}`,
        {
          name: team.name,
          level: team.level,
          description: team.description,
          details: team.details ?? undefined,
          trainingTeamKey: team.trainingTeamKey,
          sortOrder: index,
        },
        "Failed to save team order.",
      );

      if (!result.ok) {
        setSavingOrder(false);
        setError(result.error);
        return;
      }
    }

    setSavingOrder(false);
    setMessage("Team order updated.");
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
          <div className="sm:col-span-2 sm:max-w-xs">
            <Label htmlFor="team-position">Position</Label>
            <Input
              id="team-position"
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
      </AdminFormCard>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Current teams ({visibleTeams.length}
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
        {visibleTeams.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim() ? "No teams match your search." : "No teams yet."}
          </p>
        ) : (
          visibleTeams.map((team) => {
          const linkedSquad = trainingSquads.find(
            (squad) => squad.key === team.trainingTeamKey,
          );

          return (
          <div
            key={team.id}
            draggable={!search.trim()}
            onDragStart={() => setDraggingTeamId(team.id)}
            onDragEnd={() => setDraggingTeamId(null)}
            onDragOver={(event) => {
              if (!search.trim()) event.preventDefault();
            }}
            onDrop={() => {
              if (search.trim() || !draggingTeamId) return;
              moveTeamBefore(draggingTeamId, team.id);
            }}
            className="cursor-grab"
          >
            <AdminListItem
              title={team.name}
              subtitle={`${team.level}${linkedSquad ? ` · ${linkedSquad.name}` : ""}`}
              actionHref={`/admin/teams/${team.id}`}
              actionLabel="Manage team"
              onDelete={() => handleDelete(team.id)}
              deleting={deletingId === team.id}
            />
          </div>
          );
        })
        )}
        {!search.trim() && (
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-zinc-500">Drag team rows to change order.</p>
            <Button
              type="button"
              size="sm"
              disabled={!hasOrderChanges || savingOrder}
              onClick={() => void saveOrder()}
            >
              {savingOrder ? "Saving..." : "Save order"}
            </Button>
          </div>
        )}
      </div>
    </AdminSection>
  );
}
