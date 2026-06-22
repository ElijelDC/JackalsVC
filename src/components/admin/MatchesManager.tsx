"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AdminFormCard,
  AdminListItem,
  scrollToAdminForm,
} from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/InputFields";
import { MATCH_VENUES, formatMatchTitle, formatMatchVenueLabel } from "@/lib/match-config";
import { TRAINING_TEAMS } from "@/lib/training-teams-config";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type TeamMatchItem = {
  id: string;
  trainingTeamKey: string;
  opponentName: string;
  venue: string;
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes: string | null;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function getTeamLabel(key: string) {
  return TRAINING_TEAMS.find((team) => team.key === key)?.name ?? key;
}

const emptyForm = {
  trainingTeamKey: TRAINING_TEAMS[0]?.key ?? "DIV2_MENS",
  opponentName: "",
  venue: "HOME" as (typeof MATCH_VENUES)[number],
  location: "",
  warmUpTime: "",
  matchStart: "",
  notes: "",
};

type MatchFormState = {
  trainingTeamKey: string;
  opponentName: string;
  venue: (typeof MATCH_VENUES)[number];
  location: string;
  warmUpTime: string;
  matchStart: string;
  notes: string;
};

export function MatchesManager({
  initialMatches,
}: {
  initialMatches: TeamMatchItem[];
}) {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MatchFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadMatches = useCallback(async () => {
    const result = await apiGet<{ matches: TeamMatchItem[] }>(
      "/api/admin/matches",
    );
    if (result.ok) setMatches(result.data.matches);
  }, []);

  const startEdit = (match: TeamMatchItem) => {
    setEditingId(match.id);
    setForm({
      trainingTeamKey: match.trainingTeamKey,
      opponentName: match.opponentName,
      venue: (match.venue as (typeof MATCH_VENUES)[number]) ?? "HOME",
      location: match.location,
      warmUpTime: toDatetimeLocal(match.warmUpTime),
      matchStart: toDatetimeLocal(match.matchStart),
      notes: match.notes ?? "",
    });
    setError(null);
    setMessage(null);
    scrollToAdminForm();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      trainingTeamKey: form.trainingTeamKey,
      opponentName: form.opponentName,
      venue: form.venue,
      location: form.location,
      warmUpTime: form.warmUpTime,
      matchStart: form.matchStart,
      notes: form.notes || undefined,
    };

    const result = editingId
      ? await apiPut(`/api/admin/matches/${editingId}`, payload)
      : await apiPost("/api/admin/matches", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Match updated." : "Match added.");
    resetForm();
    await loadMatches();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/matches/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadMatches();
    router.refresh();
  };

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  return (
    <AdminSection
      title="Squad matches"
      description="Schedule league and friendly matches per training squad. Members only see matches for their assigned team."
    >
      <AdminFormCard
        title={editingId ? "Edit match" : "Add match"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add match"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="match-team">Squad</Label>
            <Select
              id="match-team"
              value={form.trainingTeamKey}
              onChange={(event) =>
                setForm({ ...form, trainingTeamKey: event.target.value })
              }
              required
            >
              {TRAINING_TEAMS.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="match-venue">Home or away</Label>
            <Select
              id="match-venue"
              value={form.venue}
              onChange={(event) =>
                setForm({
                  ...form,
                  venue: event.target.value as (typeof MATCH_VENUES)[number],
                })
              }
              required
            >
              {MATCH_VENUES.map((venue) => (
                <option key={venue} value={venue}>
                  {formatMatchVenueLabel(venue)}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="match-opponent">Opponent name</Label>
            <Input
              id="match-opponent"
              value={form.opponentName}
              onChange={(event) =>
                setForm({ ...form, opponentName: event.target.value })
              }
              placeholder="e.g. Beach Kings VC"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="match-location">Location</Label>
            <Input
              id="match-location"
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
              placeholder="Court or venue address"
              required
            />
          </div>
          <div>
            <Label htmlFor="match-warmup">Warm-up time</Label>
            <Input
              id="match-warmup"
              type="datetime-local"
              value={form.warmUpTime}
              onChange={(event) =>
                setForm({ ...form, warmUpTime: event.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="match-start">Match start</Label>
            <Input
              id="match-start"
              type="datetime-local"
              value={form.matchStart}
              onChange={(event) =>
                setForm({ ...form, matchStart: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="match-notes">Notes (optional)</Label>
            <Textarea
              id="match-notes"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              rows={3}
              placeholder="Kit colour, meeting point, etc."
            />
          </div>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          All matches ({matches.length})
        </h3>
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-400">No matches scheduled yet.</p>
        ) : (
          matches.map((match) => (
            <AdminListItem
              key={match.id}
              title={`${getTeamLabel(match.trainingTeamKey)} · ${formatMatchTitle(match.opponentName, match.venue)}`}
              subtitle={`${formatMatchVenueLabel(match.venue)} · ${match.location} · Warm-up ${format(new Date(match.warmUpTime), "d MMM yyyy HH:mm")} · Kick-off ${format(new Date(match.matchStart), "HH:mm")}`}
              onEdit={() => startEdit(match)}
              onDelete={() => handleDelete(match.id)}
              deleting={deletingId === match.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
