"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { getPositionOptions, isKnownPosition } from "@/lib/team-positions";
import { cn } from "@/lib/utils";
import type { TrainingTeam } from "@/lib/training-teams-config";

type TeamMember = {
  id: string;
  clubMemberId: string | null;
  name: string;
  role: string;
  position: string | null;
  isCaptain: boolean;
  photoUrl: string | null;
  sortOrder: number;
};

type Team = {
  id: string;
  name: string;
  level: string;
  description: string;
  details: string | null;
  trainingTeamKey: string | null;
  sortOrder: number;
  members: TeamMember[];
};

type ManualMemberDraft = {
  name: string;
  position: string;
  photoUrl: string;
  isCaptain: boolean;
};

const emptyManualDraft = (): ManualMemberDraft => ({
  name: "",
  position: "",
  photoUrl: "",
  isCaptain: false,
});

export function TeamEditor({
  initialTeam,
  trainingSquads,
}: {
  initialTeam: Team;
  trainingSquads: TrainingTeam[];
}) {
  return (
    <TeamEditorInner
      key={teamSyncKey(initialTeam)}
      initialTeam={initialTeam}
      trainingSquads={trainingSquads}
    />
  );
}

function teamSyncKey(team: Team) {
  return `${team.id}:${team.name}:${team.trainingTeamKey}:${team.members.length}:${team.members.map((member) => member.id).join(",")}`;
}

function TeamEditorInner({
  initialTeam,
  trainingSquads,
}: {
  initialTeam: Team;
  trainingSquads: TrainingTeam[];
}) {
  const router = useRouter();
  const [team, setTeam] = useState(initialTeam);
  const [teamForm, setTeamForm] = useState({
    name: initialTeam.name,
    level: initialTeam.level,
    description: initialTeam.description,
    details: initialTeam.details ?? "",
    trainingTeamKey: initialTeam.trainingTeamKey ?? "",
    sortOrder: initialTeam.sortOrder,
  });
  const [teamLoading, setTeamLoading] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [addingCoach, setAddingCoach] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [coachDraft, setCoachDraft] = useState(emptyManualDraft);
  const [playerDraft, setPlayerDraft] = useState(emptyManualDraft);
  const [addingMember, setAddingMember] = useState(false);

  const squadLinked = Boolean(team.trainingTeamKey);

  const loadTeam = useCallback(async () => {
    const result = await apiGet<{ team: Team }>(
      `/api/admin/teams/${initialTeam.id}`,
    );
    if (result.ok) setTeam(result.data.team);
  }, [initialTeam.id]);

  const handleTeamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTeamLoading(true);
    setTeamError(null);
    setTeamMessage(null);

    const result = await apiPut(`/api/admin/teams/${team.id}`, {
      name: teamForm.name,
      level: teamForm.level,
      description: teamForm.description,
      details: teamForm.details || undefined,
      trainingTeamKey: teamForm.trainingTeamKey || null,
      sortOrder: teamForm.sortOrder,
    });

    setTeamLoading(false);

    if (!result.ok) {
      setTeamError(result.error);
      return;
    }

    setTeamMessage("Team details saved.");
    await loadTeam();
    router.refresh();
  };

  const saveMember = async (
    member: TeamMember,
    updates: { name?: string; position?: string; photoUrl?: string; isCaptain?: boolean },
  ) => {
    setSavingMemberId(member.id);
    setMemberError(null);

    const result = member.clubMemberId
      ? await apiPut(`/api/admin/teams/${team.id}/members/${member.id}`, {
          position: updates.position || undefined,
          ...(updates.isCaptain !== undefined
            ? { isCaptain: updates.isCaptain }
            : {}),
        })
      : await apiPut(`/api/admin/teams/${team.id}/members/${member.id}`, {
          name: updates.name ?? member.name,
          role: member.role,
          position: updates.position || undefined,
          photoUrl: updates.photoUrl ?? member.photoUrl ?? undefined,
          sortOrder: member.sortOrder,
          isCaptain: updates.isCaptain ?? member.isCaptain,
        });

    setSavingMemberId(null);

    if (!result.ok) {
      setMemberError(result.error);
      return false;
    }

    await loadTeam();
    return true;
  };

  const addManualMember = async (
    role: "COACH" | "PLAYER",
    draft: ManualMemberDraft,
  ) => {
    if (!draft.name.trim()) {
      setMemberError("Name is required.");
      return;
    }

    setAddingMember(true);
    setMemberError(null);

    const result = await apiPost(`/api/admin/teams/${team.id}/members`, {
      name: draft.name.trim(),
      role,
      position: draft.position.trim() || undefined,
      photoUrl: draft.photoUrl.trim() || undefined,
      sortOrder: team.members.filter((member) => member.role === role).length,
      isCaptain: role === "PLAYER" ? draft.isCaptain : false,
    });

    setAddingMember(false);

    if (!result.ok) {
      setMemberError(result.error);
      return;
    }

    if (role === "COACH") {
      setCoachDraft(emptyManualDraft());
      setAddingCoach(false);
    } else {
      setPlayerDraft(emptyManualDraft());
      setAddingPlayer(false);
    }

    await loadTeam();
    router.refresh();
  };

  const deleteMember = async (member: TeamMember) => {
    if (member.clubMemberId) return;
    if (!confirm(`Remove ${member.name} from this team page?`)) return;

    setDeletingMemberId(member.id);
    setMemberError(null);

    const result = await apiDelete(
      `/api/admin/teams/${team.id}/members/${member.id}`,
    );

    setDeletingMemberId(null);

    if (!result.ok) {
      setMemberError(result.error);
      return;
    }

    await loadTeam();
    router.refresh();
  };

  const coaches = team.members.filter((member) => member.role === "COACH");
  const players = team.members.filter((member) => member.role === "PLAYER");

  return (
    <AdminSection
      title="Manage team"
      description={
        squadLinked
          ? `${team.name} — update team details and roster. Squad players sync automatically from the club roster.`
          : `${team.name} — update team details, coaches, and players.`
      }
    >
      <Link
        href="/admin/teams"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-jackals-red-light"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to teams
      </Link>

      <AdminFormCard
        collapsible
        openTriggerLabel="Edit team details"
        title="Team details"
        error={teamError}
        message={teamMessage}
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
            <Label htmlFor="team-squad">Linked training squad</Label>
            <Select
              id="team-squad"
              value={teamForm.trainingTeamKey}
              onChange={(event) =>
                setTeamForm({
                  ...teamForm,
                  trainingTeamKey: event.target.value,
                })
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

      {memberError && (
        <p className="mb-4 text-sm text-red-400">{memberError}</p>
      )}

      <div className="space-y-6">
        <RosterSection
          title="Coaches"
          members={coaches}
          memberRole="COACH"
          emptyLabel="No coaches yet."
          savingMemberId={savingMemberId}
          deletingMemberId={deletingMemberId}
          onSave={saveMember}
          onDelete={deleteMember}
          footer={
            addingCoach ? (
              <ManualAddRow
                draft={coachDraft}
                onChange={setCoachDraft}
                memberRole="COACH"
                loading={addingMember}
                onCancel={() => {
                  setAddingCoach(false);
                  setCoachDraft(emptyManualDraft());
                }}
                onSave={() => addManualMember("COACH", coachDraft)}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setAddingCoach(true)}
              >
                <Plus className="h-4 w-4" />
                Add coach
              </Button>
            )
          }
        />

        <RosterSection
          title="Players"
          members={players}
          memberRole="PLAYER"
          emptyLabel={
            squadLinked
              ? "No players on this squad yet — assign them on the club roster."
              : "No players yet."
          }
          savingMemberId={savingMemberId}
          deletingMemberId={deletingMemberId}
          onSave={saveMember}
          onDelete={deleteMember}
          headerNote={
            squadLinked
              ? "Synced from the club roster. Change squad or deactivate on the roster to remove."
              : undefined
          }
          footer={
            squadLinked ? null : addingPlayer ? (
              <ManualAddRow
                draft={playerDraft}
                onChange={setPlayerDraft}
                memberRole="PLAYER"
                loading={addingMember}
                onCancel={() => {
                  setAddingPlayer(false);
                  setPlayerDraft(emptyManualDraft());
                }}
                onSave={() => addManualMember("PLAYER", playerDraft)}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setAddingPlayer(true)}
              >
                <Plus className="h-4 w-4" />
                Add player
              </Button>
            )
          }
        />
      </div>
    </AdminSection>
  );
}

function RosterSection({
  title,
  members,
  memberRole,
  emptyLabel,
  headerNote,
  savingMemberId,
  deletingMemberId,
  onSave,
  onDelete,
  footer,
}: {
  title: string;
  members: TeamMember[];
  memberRole: "PLAYER" | "COACH";
  emptyLabel: string;
  headerNote?: string;
  savingMemberId: string | null;
  deletingMemberId: string | null;
  onSave: (
    member: TeamMember,
    updates: { name?: string; position?: string; photoUrl?: string; isCaptain?: boolean },
  ) => Promise<boolean>;
  onDelete: (member: TeamMember) => void;
  footer: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <h3 className="font-display text-sm font-semibold text-white">
          {title}
          <span className="ml-2 font-normal text-zinc-500">{members.length}</span>
        </h3>
        {headerNote && (
          <p className="mt-1 text-xs text-zinc-500">{headerNote}</p>
        )}
      </div>

      {members.length === 0 ? (
        <p className="px-4 py-6 text-sm text-zinc-500 sm:px-5">{emptyLabel}</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              memberRole={memberRole}
              saving={savingMemberId === member.id}
              deleting={deletingMemberId === member.id}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}

      {footer && <div className="border-t border-white/10 p-4 sm:px-5">{footer}</div>}
    </Card>
  );
}

function MemberRow({
  member,
  memberRole,
  saving,
  deleting,
  onSave,
  onDelete,
}: {
  member: TeamMember;
  memberRole: "PLAYER" | "COACH";
  saving: boolean;
  deleting: boolean;
  onSave: (
    member: TeamMember,
    updates: { name?: string; position?: string; photoUrl?: string; isCaptain?: boolean },
  ) => Promise<boolean>;
  onDelete: (member: TeamMember) => void;
}) {
  const [name, setName] = useState(member.name);
  const [position, setPosition] = useState(member.position ?? "");
  const [isCaptain, setIsCaptain] = useState(member.isCaptain ?? false);
  const rosterLinked = Boolean(member.clubMemberId);
  const canDelete = !rosterLinked;
  const isPlayer = memberRole === "PLAYER";

  useEffect(() => {
    setName(member.name);
    setPosition(member.position ?? "");
    setIsCaptain(member.isCaptain ?? false);
  }, [member.id, member.name, member.position, member.isCaptain]);

  const persist = async (updates?: {
    name?: string;
    position?: string;
    isCaptain?: boolean;
  }) => {
    const nextName = updates?.name ?? name;
    const nextPosition = updates?.position ?? position;
    const nextIsCaptain = updates?.isCaptain ?? isCaptain;

    if (
      nextName === member.name &&
      nextPosition === (member.position ?? "") &&
      nextIsCaptain === (member.isCaptain ?? false) &&
      rosterLinked
    ) {
      return;
    }

    if (
      !rosterLinked &&
      nextName === member.name &&
      nextPosition === (member.position ?? "") &&
      nextIsCaptain === (member.isCaptain ?? false)
    ) {
      return;
    }

    if (!rosterLinked && !nextName.trim()) {
      setName(member.name);
      return;
    }

    const ok = await onSave(member, {
      name: rosterLinked ? undefined : nextName.trim(),
      position: nextPosition,
      isCaptain: isPlayer ? nextIsCaptain : undefined,
    });

    if (!ok) {
      setName(member.name);
      setPosition(member.position ?? "");
      setIsCaptain(member.isCaptain ?? false);
    }
  };

  return (
    <li className="px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          {rosterLinked ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-white">{member.name}</span>
              <Badge className="border border-blue-500/30 bg-blue-500/10 px-2 py-0 text-[10px] text-blue-300">
                Club Member
              </Badge>
            </div>
          ) : (
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => void persist()}
              disabled={saving || deleting}
              className="py-2"
              aria-label="Name"
            />
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <PositionSelect
            role={memberRole}
            value={position}
            disabled={saving || deleting}
            allowEmpty={!position}
            onChange={(nextPosition) => {
              setPosition(nextPosition);
              void persist({ position: nextPosition });
            }}
          />
          {isPlayer && (
            <CaptainSelect
              value={isCaptain}
              disabled={saving || deleting}
              onChange={(nextIsCaptain) => {
                setIsCaptain(nextIsCaptain);
                void persist({ isCaptain: nextIsCaptain });
              }}
            />
          )}
          {saving && (
            <span className="shrink-0 text-xs text-zinc-500">Saving…</span>
          )}
        </div>

        {canDelete && (
          <button
            type="button"
            disabled={deleting || saving}
            onClick={() => onDelete(member)}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-sm p-2 text-zinc-500 transition-colors",
              "hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50",
            )}
            aria-label={`Remove ${member.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </li>
  );
}

function ManualAddRow({
  draft,
  onChange,
  memberRole,
  loading,
  onCancel,
  onSave,
}: {
  draft: ManualMemberDraft;
  onChange: (draft: ManualMemberDraft) => void;
  memberRole: "PLAYER" | "COACH";
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-white/15 bg-white/[0.02] p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(0,11rem)_minmax(0,9rem)]">
        <Input
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          placeholder="Name"
          disabled={loading}
          autoFocus
        />
        <PositionSelect
          role={memberRole}
          value={draft.position}
          disabled={loading}
          onChange={(position) => onChange({ ...draft, position })}
          allowEmpty
        />
        {memberRole === "PLAYER" ? (
          <CaptainSelect
            value={draft.isCaptain}
            disabled={loading}
            onChange={(isCaptain) => onChange({ ...draft, isCaptain })}
          />
        ) : (
          <div className="hidden sm:block" />
        )}
      </div>
      <Input
        value={draft.photoUrl}
        onChange={(event) => onChange({ ...draft, photoUrl: event.target.value })}
        placeholder="Photo URL (optional)"
        disabled={loading}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={loading} onClick={onSave}>
          {loading ? "Adding…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PositionSelect({
  role,
  value,
  disabled,
  onChange,
  allowEmpty = false,
}: {
  role: "PLAYER" | "COACH";
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  allowEmpty?: boolean;
}) {
  const options = getPositionOptions(role);
  const showLegacy = value && !isKnownPosition(role, value);

  return (
    <Select
      value={value}
      disabled={disabled}
      className="w-full py-2 text-sm"
      aria-label={role === "COACH" ? "Coach role" : "Position"}
      onChange={(event) => onChange(event.target.value)}
    >
      {allowEmpty && (
        <option value="">
          {role === "COACH" ? "Select role" : "Select position"}
        </option>
      )}
      {showLegacy && <option value={value}>{value}</option>}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </Select>
  );
}

function CaptainSelect({
  value,
  disabled,
  onChange,
}: {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Select
      value={value ? "captain" : ""}
      disabled={disabled}
      className="w-full py-2 text-sm"
      aria-label="Captain"
      onChange={(event) => onChange(event.target.value === "captain")}
    >
      <option value="">—</option>
      <option value="captain">Captain</option>
    </Select>
  );
}
