"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  position: string | null;
  photoUrl: string | null;
  sortOrder: number;
};

type Team = {
  id: string;
  name: string;
  level: string;
  description: string;
  details: string | null;
  sortOrder: number;
  members: TeamMember[];
};

const MEMBER_ROLES = ["PLAYER", "COACH"] as const;

const emptyMemberForm = {
  name: "",
  role: "PLAYER" as (typeof MEMBER_ROLES)[number],
  position: "",
  photoUrl: "",
  sortOrder: 0,
};

export function TeamEditor({ initialTeam }: { initialTeam: Team }) {
  const router = useRouter();
  const [team, setTeam] = useState(initialTeam);
  const [teamForm, setTeamForm] = useState({
    name: initialTeam.name,
    level: initialTeam.level,
    description: initialTeam.description,
    details: initialTeam.details ?? "",
    sortOrder: initialTeam.sortOrder,
  });
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    const result = await apiGet<{ team: Team }>(
      `/api/admin/teams/${initialTeam.id}`,
    );
    if (result.ok) setTeam(result.data.team);
  }, [initialTeam.id]);

  const resetMemberForm = () => {
    setMemberForm(emptyMemberForm);
    setEditingMemberId(null);
  };

  const startEditMember = (member: TeamMember) => {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name,
      role: (member.role as (typeof MEMBER_ROLES)[number]) ?? "PLAYER",
      position: member.position ?? "",
      photoUrl: member.photoUrl ?? "",
      sortOrder: member.sortOrder,
    });
    setError(null);
    setMessage(null);
  };

  const handleTeamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: teamForm.name,
      level: teamForm.level,
      description: teamForm.description,
      details: teamForm.details || undefined,
      sortOrder: teamForm.sortOrder,
    };

    const result = await apiPut(`/api/admin/teams/${team.id}`, payload);
    setTeamLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Team details saved.");
    await loadTeam();
    router.refresh();
  };

  const handleMemberSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMemberLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: memberForm.name,
      role: memberForm.role,
      position: memberForm.position || undefined,
      photoUrl: memberForm.photoUrl || undefined,
      sortOrder: memberForm.sortOrder,
    };

    const result = editingMemberId
      ? await apiPut(
          `/api/admin/teams/${team.id}/members/${editingMemberId}`,
          payload,
        )
      : await apiPost(`/api/admin/teams/${team.id}/members`, payload);

    setMemberLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingMemberId ? "Member updated." : "Member added.");
    resetMemberForm();
    await loadTeam();
    router.refresh();
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Remove this person from the roster?")) return;
    setDeletingMemberId(memberId);
    const result = await apiDelete(
      `/api/admin/teams/${team.id}/members/${memberId}`,
    );
    setDeletingMemberId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingMemberId === memberId) resetMemberForm();
    await loadTeam();
    router.refresh();
  };

  useEffect(() => {
    setTeam(initialTeam);
    setTeamForm({
      name: initialTeam.name,
      level: initialTeam.level,
      description: initialTeam.description,
      details: initialTeam.details ?? "",
      sortOrder: initialTeam.sortOrder,
    });
  }, [initialTeam]);

  const coaches = team.members.filter((member) => member.role === "COACH");
  const players = team.members.filter((member) => member.role === "PLAYER");

  return (
    <AdminSection
      title={team.name}
      description="Edit team details, coaches, and squad roster."
    >
      <Link
        href="/admin/teams"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teams
      </Link>

      <AdminFormCard
        title="Team details"
        error={error}
        message={message}
        onSubmit={handleTeamSubmit}
        submitLabel="Save team details"
        loading={teamLoading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="team-level">Level label</Label>
            <Input
              id="team-level"
              value={teamForm.level}
              onChange={(event) =>
                setTeamForm({ ...teamForm, level: event.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="team-sort">Sort order</Label>
            <Input
              id="team-sort"
              type="number"
              min={0}
              value={teamForm.sortOrder}
              onChange={(event) =>
                setTeamForm({
                  ...teamForm,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              value={teamForm.name}
              onChange={(event) =>
                setTeamForm({ ...teamForm, name: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="team-description">Short description</Label>
            <Textarea
              id="team-description"
              rows={3}
              value={teamForm.description}
              onChange={(event) =>
                setTeamForm({ ...teamForm, description: event.target.value })
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="team-details">Extended details</Label>
            <Textarea
              id="team-details"
              rows={5}
              value={teamForm.details}
              onChange={(event) =>
                setTeamForm({ ...teamForm, details: event.target.value })
              }
              placeholder="Training schedule, league info, selection criteria…"
            />
          </div>
        </div>
      </AdminFormCard>

      <AdminFormCard
        title={editingMemberId ? "Edit roster member" : "Add roster member"}
        error={editingMemberId ? error : null}
        message={editingMemberId ? message : null}
        onSubmit={handleMemberSubmit}
        onCancel={editingMemberId ? resetMemberForm : undefined}
        submitLabel={editingMemberId ? "Save member" : "Add member"}
        loading={memberLoading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="member-role">Role</Label>
            <Select
              id="member-role"
              value={memberForm.role}
              onChange={(event) =>
                setMemberForm({
                  ...memberForm,
                  role: event.target.value as (typeof MEMBER_ROLES)[number],
                })
              }
            >
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "COACH" ? "Coach" : "Player"}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="member-sort">Sort order</Label>
            <Input
              id="member-sort"
              type="number"
              min={0}
              value={memberForm.sortOrder}
              onChange={(event) =>
                setMemberForm({
                  ...memberForm,
                  sortOrder: Number(event.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="member-name">Name</Label>
            <Input
              id="member-name"
              value={memberForm.name}
              onChange={(event) =>
                setMemberForm({ ...memberForm, name: event.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="member-position">
              {memberForm.role === "COACH" ? "Coach title" : "Position"}
            </Label>
            <Input
              id="member-position"
              value={memberForm.position}
              onChange={(event) =>
                setMemberForm({ ...memberForm, position: event.target.value })
              }
              placeholder={
                memberForm.role === "COACH" ? "Head Coach" : "Outside Hitter"
              }
            />
          </div>
          <div>
            <Label htmlFor="member-photo">Photo URL</Label>
            <Input
              id="member-photo"
              value={memberForm.photoUrl}
              onChange={(event) =>
                setMemberForm({ ...memberForm, photoUrl: event.target.value })
              }
              placeholder="/teams/player.jpg"
            />
          </div>
        </div>
      </AdminFormCard>

      {!editingMemberId && (error || message) && (
        <p
          className={`mb-4 text-sm ${error ? "text-red-400" : "text-green-400"}`}
        >
          {error ?? message}
        </p>
      )}

      <div className="space-y-8">
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Coaches ({coaches.length})
          </h3>
          {coaches.length === 0 ? (
            <p className="text-sm text-zinc-500">No coaches added yet.</p>
          ) : (
            coaches.map((member) => (
              <AdminListItem
                key={member.id}
                title={member.name}
                subtitle={member.position ?? "Coach"}
                note={member.photoUrl ?? undefined}
                onEdit={() => startEditMember(member)}
                onDelete={() => handleDeleteMember(member.id)}
                deleting={deletingMemberId === member.id}
              />
            ))
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Players ({players.length})
          </h3>
          {players.length === 0 ? (
            <p className="text-sm text-zinc-500">No players added yet.</p>
          ) : (
            players.map((member) => (
              <AdminListItem
                key={member.id}
                title={member.name}
                subtitle={member.position ?? "Player"}
                note={member.photoUrl ?? undefined}
                onEdit={() => startEditMember(member)}
                onDelete={() => handleDeleteMember(member.id)}
                deleting={deletingMemberId === member.id}
              />
            ))
          )}
        </div>
      </div>
    </AdminSection>
  );
}
