"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { ChevronDown, Trash2, UserRoundCheck, UserRoundX } from "lucide-react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminBulkCsvImport } from "@/components/admin/AdminBulkCsvImport";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { AdminMemberProfileImage } from "@/components/admin/AdminMemberProfileImage";
import { AdminMemberVlyPhoto } from "@/components/admin/AdminMemberVlyPhoto";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client-api";
import {
  formatMembershipSubscriptionOrCoachLabel,
} from "@/lib/membership-status";
import {
  getTrainingTeamFromList,
  type TrainingTeam,
} from "@/lib/training-teams-config";
import {
  COACH_PAYMENT_TYPE_LABELS,
  COACH_PAYMENT_TYPES,
  type CoachPaymentType,
} from "@/lib/coach-payment-type";
import { cn } from "@/lib/utils";

type ClubMember = {
  id: string;
  vlyNumber: string;
  name: string;
  active: boolean;
  rosterRole: string;
  coachPaymentType: CoachPaymentType | null;
  trainingTeamKey: string | null;
  trainingTeamKeys: string[];
  profileImageUrl: string | null;
  vlyMembershipPhotoUrl: string | null;
  userId: string | null;
  user: { id: string; email: string } | null;
};

type MemberSubscription = {
  planName: string;
  paymentSchedule: string;
  status: string;
};

const emptyForm = {
  vlyNumber: "",
  name: "",
  trainingTeamKey: "",
  trainingTeamKeys: [] as string[],
  rosterRole: "PLAYER",
  coachPaymentType: "PAID" as CoachPaymentType,
};

function memberSquadKeys(member: ClubMember) {
  return member.trainingTeamKeys.length > 0
    ? member.trainingTeamKeys
    : member.trainingTeamKey
      ? [member.trainingTeamKey]
      : [];
}

function memberSquadLabel(
  member: ClubMember,
  trainingTeams: TrainingTeam[],
) {
  const keys = memberSquadKeys(member);
  if (keys.length === 0) return "Unassigned";
  return keys
    .map((key) => getTrainingTeamFromList(trainingTeams, key)?.name ?? key)
    .join(", ");
}

function rosterPlanLabel(
  member: ClubMember,
  subscription: MemberSubscription | undefined,
) {
  if (member.rosterRole === "COACH") {
    return member.coachPaymentType
      ? COACH_PAYMENT_TYPE_LABELS[member.coachPaymentType]
      : "Coach";
  }
  if (!subscription) {
    return member.userId ? "No plan" : "Awaiting reg";
  }
  return formatMembershipSubscriptionOrCoachLabel(
    subscription.planName,
    subscription.paymentSchedule,
    subscription.status,
  );
}

function SquadCheckboxGroup({
  selectedKeys,
  trainingTeams,
  disabled,
  onChange,
  idPrefix,
}: {
  selectedKeys: string[];
  trainingTeams: TrainingTeam[];
  disabled?: boolean;
  onChange: (keys: string[]) => void;
  idPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {trainingTeams.map((team) => {
        const checked = selectedKeys.includes(team.key);
        return (
          <label
            key={team.key}
            htmlFor={`${idPrefix}-${team.key}`}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
              checked
                ? "border-jackals-red/40 bg-jackals-red/10 text-white"
                : "border-white/10 bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              id={`${idPrefix}-${team.key}`}
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-black/20 text-jackals-red focus:ring-jackals-red/40"
              checked={checked}
              disabled={disabled}
              onChange={() => {
                const next = checked
                  ? selectedKeys.filter((key) => key !== team.key)
                  : [...selectedKeys, team.key];
                onChange(next);
              }}
            />
            {team.name}
          </label>
        );
      })}
    </div>
  );
}

export function ClubRosterManager({
  initialClubMembers,
  trainingTeams,
  subscriptionByUserId = {},
}: {
  initialClubMembers: ClubMember[];
  trainingTeams: TrainingTeam[];
  subscriptionByUserId?: Record<string, MemberSubscription>;
}) {
  const [clubMembers, setClubMembers] = useState(initialClubMembers);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [memberNumberDrafts, setMemberNumberDrafts] = useState<Record<string, string>>({});
  const [savingMemberNumberId, setSavingMemberNumberId] = useState<string | null>(null);
  const [savedMemberNumberById, setSavedMemberNumberById] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMembers = useMemo(() => {
    const filtered = clubMembers.filter((member) => {
      if (memberFilter === "awaiting-registration-players") {
        if (member.userId || member.rosterRole !== "PLAYER") {
          return false;
        }
      }

      if (memberFilter === "active" && !member.active) return false;
      if (memberFilter === "inactive" && member.active) return false;

      if (roleFilter !== "all" && member.rosterRole !== roleFilter) {
        return false;
      }

      if (teamFilter !== "all") {
        const keys = memberSquadKeys(member);
        if (teamFilter === "unassigned") {
          if (keys.length > 0) return false;
        } else if (!keys.includes(teamFilter)) {
          return false;
        }
      }

      return matchesAdminSearch(
        search,
        member.vlyNumber,
        member.name,
        member.user?.email ?? "",
        member.active ? "active" : "inactive",
        member.rosterRole,
        member.userId
          ? subscriptionByUserId[member.userId]?.planName ?? ""
          : "",
        memberSquadKeys(member)
          .map((key) => getTrainingTeamFromList(trainingTeams, key)?.name ?? "")
          .join(" "),
      );
    });

    return [...filtered].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      return sortBy === "name_asc" ? comparison : -comparison;
    });
  }, [clubMembers, search, teamFilter, memberFilter, roleFilter, sortBy, trainingTeams, subscriptionByUserId]);

  const hasActiveFilters =
    search.trim().length > 0 ||
    teamFilter !== "all" ||
    memberFilter !== "all" ||
    roleFilter !== "all" ||
    sortBy !== "name_asc";

  const loadClubMembers = useCallback(async () => {
    const result = await apiGet<{ clubMembers: ClubMember[] }>(
      "/api/admin/club-members",
    );
    if (result.ok) {
      setClubMembers(result.data.clubMembers);
    }
  }, []);

  const addMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (form.rosterRole === "COACH" && form.trainingTeamKeys.length === 0) {
      setLoading(false);
      setError("Select at least one squad for this coach.");
      return;
    }

    const payload =
      form.rosterRole === "COACH"
        ? {
            ...form,
            trainingTeamKeys: form.trainingTeamKeys,
            trainingTeamKey: undefined,
          }
        : form;

    const result = await apiPost(
      "/api/admin/club-members",
      payload,
      "Failed to add club member",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setForm(emptyForm);
    setMessage("Club member added");
    await loadClubMembers();
  };

  const toggleActive = async (member: ClubMember) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch<{ clubMember: ClubMember }>(
      `/api/admin/club-members/${member.id}`,
      { active: !member.active },
      "Failed to update roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setClubMembers((current) =>
      current.map((row) =>
        row.id === member.id
          ? { ...row, ...result.data.clubMember, active: !member.active }
          : row,
      ),
    );
    await loadClubMembers();
  };

  const assignTeam = async (member: ClubMember, trainingTeamKey: string) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { trainingTeamKey: trainingTeamKey || null },
      "Failed to assign training team",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  const assignCoachSquads = async (member: ClubMember, trainingTeamKeys: string[]) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { trainingTeamKeys },
      "Failed to assign coach squads",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  const saveMemberNumber = async (member: ClubMember) => {
    const draft = memberNumberDrafts[member.id];
    if (draft === undefined) return;

    const normalized = draft.trim().toUpperCase().replace(/\s+/g, "");
    if (!normalized || normalized === member.vlyNumber) {
      setMemberNumberDrafts((current) => {
        const next = { ...current };
        delete next[member.id];
        return next;
      });
      return;
    }

    setLoading(true);
    setSavingMemberNumberId(member.id);
    setError(null);
    setMessage(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { vlyNumber: normalized },
      "Failed to update member number",
    );

    setLoading(false);
    setSavingMemberNumberId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMemberNumberDrafts((current) => {
      const next = { ...current };
      delete next[member.id];
      return next;
    });
    setSavedMemberNumberById((current) => ({
      ...current,
      [member.id]: true,
    }));
    setTimeout(() => {
      setSavedMemberNumberById((current) => {
        if (!current[member.id]) return current;
        const next = { ...current };
        delete next[member.id];
        return next;
      });
    }, 1600);
    setMessage("Member number updated");
    await loadClubMembers();
  };

  const assignRosterRole = async (
    member: ClubMember,
    rosterRole: "PLAYER" | "COACH",
  ) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { rosterRole },
      "Failed to update roster role",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  const assignCoachPaymentType = async (
    member: ClubMember,
    coachPaymentType: CoachPaymentType,
  ) => {
    setLoading(true);
    setError(null);

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { coachPaymentType },
      "Failed to update coach payment type",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  const removeMember = async (member: ClubMember) => {
    if (member.userId) return;

    setLoading(true);
    setError(null);

    const result = await apiDelete(
      `/api/admin/club-members/${member.id}`,
      "Failed to remove roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    await loadClubMembers();
  };

  return (
    <AdminSection
      title="Registered Members"
      description="Players allowed to register — add VLY numbers, names, and training squads before they sign up."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add club member entry"
        title="Add club member entry"
        error={error}
        message={message}
        onSubmit={addMember}
        submitLabel={loading ? "Saving..." : "Add club member"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="roster-vly">
              {form.rosterRole === "COACH" ? "VLYC coach number" : "VLY number"}
            </Label>
            <Input
              id="roster-vly"
              value={form.vlyNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  vlyNumber: event.target.value.toUpperCase(),
                }))
              }
              placeholder={form.rosterRole === "COACH" ? "VLYC12345" : "VLY12345"}
              required
            />
          </div>
          <div>
            <Label htmlFor="roster-name">Full name</Label>
            <Input
              id="roster-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label>
              {form.rosterRole === "COACH" ? "Squads" : "Team"}
            </Label>
            {form.rosterRole === "COACH" ? (
              <>
                <SquadCheckboxGroup
                  idPrefix="roster-add"
                  selectedKeys={form.trainingTeamKeys}
                  trainingTeams={trainingTeams}
                  disabled={loading}
                  onChange={(trainingTeamKeys) =>
                    setForm((current) => ({ ...current, trainingTeamKeys }))
                  }
                />
                {form.trainingTeamKeys.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Select at least one squad for this coach.
                  </p>
                ) : null}
              </>
            ) : (
              <Select
                id="roster-team"
                value={form.trainingTeamKey}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    trainingTeamKey: event.target.value,
                  }))
                }
                required
              >
                <option value="" disabled>
                  Select team
                </option>
                {trainingTeams.map((team) => (
                  <option key={team.key} value={team.key}>
                    {team.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="roster-role">Roster role</Label>
            <Select
              id="roster-role"
              value={form.rosterRole}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rosterRole: event.target.value,
                  trainingTeamKeys:
                    event.target.value === "COACH"
                      ? current.trainingTeamKey
                        ? [current.trainingTeamKey]
                        : current.trainingTeamKeys
                      : [],
                  trainingTeamKey:
                    event.target.value === "PLAYER"
                      ? current.trainingTeamKeys[0] ?? current.trainingTeamKey
                      : current.trainingTeamKey,
                }))
              }
              required
            >
              <option value="PLAYER">Player</option>
              <option value="COACH">Coach</option>
            </Select>
          </div>
          {form.rosterRole === "COACH" && (
            <div className="sm:col-span-2">
              <Label htmlFor="roster-coach-type">Coach type</Label>
              <Select
                id="roster-coach-type"
                value={form.coachPaymentType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    coachPaymentType: event.target.value as CoachPaymentType,
                  }))
                }
                required
              >
                {COACH_PAYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {COACH_PAYMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </AdminFormCard>

      <AdminBulkCsvImport type="roster" />

      <div className="mt-6">
        <div className="space-y-4">
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search VLY number, name, team, or email..."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="roster-team-filter">Team</Label>
              <Select
                id="roster-team-filter"
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
              >
                <option value="all">All teams</option>
                <option value="unassigned">Unassigned</option>
                {trainingTeams.map((team) => (
                  <option key={team.key} value={team.key}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="roster-member-filter">Member status</Label>
              <Select
                id="roster-member-filter"
                value={memberFilter}
                onChange={(event) => setMemberFilter(event.target.value)}
              >
                <option value="all">All members</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="awaiting-registration-players">
                  Awaiting registration
                </option>
              </Select>
            </div>
            <div>
              <Label htmlFor="roster-role-filter">Role</Label>
              <Select
                id="roster-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="all">All roles</option>
                <option value="PLAYER">Player</option>
                <option value="COACH">Coach</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="roster-sort">Sort by</Label>
              <Select
                id="roster-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as "name_asc" | "name_desc")
                }
              >
                <option value="name_asc">Name (A–Z)</option>
                <option value="name_desc">Name (Z–A)</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              {filteredMembers.length === clubMembers.length
                ? `${clubMembers.length} member${clubMembers.length === 1 ? "" : "s"}`
                : `${filteredMembers.length} of ${clubMembers.length} members`}
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setTeamFilter("all");
                  setMemberFilter("all");
                  setRoleFilter("all");
                  setSortBy("name_asc");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 lg:hidden">
          {filteredMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {search.trim() || teamFilter !== "all" || memberFilter !== "all" || roleFilter !== "all"
                ? "No roster entries match your filters."
                : "No roster entries yet."}
            </p>
          ) : (
            filteredMembers.map((member) => {
              const subscription = member.userId
                ? subscriptionByUserId[member.userId]
                : undefined;
              const subscriptionLabel = subscription
                ? formatMembershipSubscriptionOrCoachLabel(
                    subscription.planName,
                    subscription.paymentSchedule,
                    subscription.status,
                  )
                : null;
              const planLabel = rosterPlanLabel(member, subscription);
              const squadLabel = memberSquadLabel(member, trainingTeams);
              const expanded = expandedId === member.id;
              return (
                <article
                  key={member.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : member.id)
                      }
                      className="group flex min-w-0 flex-1 items-start gap-1.5 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                          expanded && "rotate-180",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">
                          {planLabel} · {squadLabel}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-zinc-400">
                            {member.rosterRole === "COACH" ? "Coach" : "Player"}
                          </span>
                          <span className="text-zinc-700">·</span>
                          <span
                            className={
                              member.active ? "text-emerald-400" : "text-rose-300"
                            }
                          >
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      title={member.active ? "Deactivate" : "Activate"}
                      disabled={loading}
                      onClick={() => toggleActive(member)}
                      className={cn(
                        "rounded p-1.5",
                        member.active
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-emerald-400 hover:bg-emerald-500/10",
                      )}
                    >
                      {member.active ? (
                        <UserRoundX className="h-3.5 w-3.5" />
                      ) : (
                        <UserRoundCheck className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {expanded ? (
                    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                      <p className="truncate text-sm text-zinc-400">
                        {member.user?.email ?? "Awaiting registration"}
                      </p>
                      {subscriptionLabel ? (
                        <p className="text-xs text-zinc-500">{subscriptionLabel}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <AdminMemberProfileImage
                          memberId={member.id}
                          name={member.name}
                          imageUrl={member.profileImageUrl}
                          disabled={loading}
                          onUpdated={loadClubMembers}
                        />
                        <AdminMemberVlyPhoto
                          memberId={member.id}
                          name={member.name}
                          imageUrl={member.vlyMembershipPhotoUrl}
                          disabled={loading}
                          onUpdated={loadClubMembers}
                        />
                      </div>
                      {!member.userId ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={loading}
                          onClick={() => removeMember(member)}
                          className="text-rose-300"
                        >
                          Remove from roster
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-xl border border-white/10 lg:block">
          {filteredMembers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {search.trim() || teamFilter !== "all" || memberFilter !== "all" || roleFilter !== "all"
                ? "No roster entries match your filters."
                : "No roster entries yet."}
            </p>
          ) : (
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col />
                <col className="w-[30%]" />
                <col className="w-[4.75rem]" />
                <col className="w-[5rem]" />
                <col className="w-[4.5rem]" />
              </colgroup>
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Member</th>
                  <th className="px-2 py-2.5 font-medium">Plan</th>
                  <th className="px-2 py-2.5 font-medium">Role</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {filteredMembers.map((member) => {
                  const subscription = member.userId
                    ? subscriptionByUserId[member.userId]
                    : undefined;
                  const subscriptionLabel = subscription
                    ? formatMembershipSubscriptionOrCoachLabel(
                        subscription.planName,
                        subscription.paymentSchedule,
                        subscription.status,
                      )
                    : null;
                  const planLabel = rosterPlanLabel(member, subscription);
                  const expanded = expandedId === member.id;
                  const squadLabel = memberSquadLabel(member, trainingTeams);

                  return (
                    <Fragment key={member.id}>
                      <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : member.id)
                            }
                            className="group flex min-w-0 items-center gap-1.5 text-left"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                expanded && "rotate-180",
                              )}
                            />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-white group-hover:text-jackals-gold">
                                {member.name}
                              </span>
                              <span className="block truncate text-[11px] text-zinc-600">
                                {squadLabel}
                              </span>
                            </span>
                          </button>
                        </td>
                        <td className="truncate px-2 py-2 text-zinc-400">
                          {planLabel}
                        </td>
                        <td className="px-2 py-2 text-zinc-400">
                          {member.rosterRole === "COACH" ? "Coach" : "Player"}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                              member.active
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-rose-500/10 text-rose-300",
                            )}
                          >
                            {member.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              title={member.active ? "Deactivate" : "Activate"}
                              disabled={loading}
                              onClick={() => toggleActive(member)}
                              className={cn(
                                "rounded p-1.5 disabled:opacity-40",
                                member.active
                                  ? "text-red-400 hover:bg-red-500/10"
                                  : "text-emerald-400 hover:bg-emerald-500/10",
                              )}
                            >
                              {member.active ? (
                                <UserRoundX className="h-3.5 w-3.5" />
                              ) : (
                                <UserRoundCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                            {!member.userId ? (
                              <button
                                type="button"
                                title="Remove"
                                disabled={loading}
                                onClick={() => removeMember(member)}
                                className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={5} className="px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
                              <div className="flex flex-wrap items-start gap-3">
                                <AdminMemberProfileImage
                                  memberId={member.id}
                                  name={member.name}
                                  imageUrl={member.profileImageUrl}
                                  disabled={loading}
                                  onUpdated={loadClubMembers}
                                />
                                <AdminMemberVlyPhoto
                                  memberId={member.id}
                                  name={member.name}
                                  imageUrl={member.vlyMembershipPhotoUrl}
                                  disabled={loading}
                                  onUpdated={loadClubMembers}
                                />
                              </div>

                              <div className="space-y-3">
                                <p className="text-sm text-zinc-400">
                                  <span className="text-zinc-500">VLY:</span>{" "}
                                  {member.vlyNumber}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  <span className="text-zinc-500">Squad:</span>{" "}
                                  {squadLabel}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  <span className="text-zinc-500">Email:</span>{" "}
                                  {member.user?.email ?? "Awaiting registration"}
                                </p>

                                {subscriptionLabel ? (
                                  <p className="text-xs font-medium text-zinc-300">
                                    {subscriptionLabel}
                                    {subscription?.status === "PENDING_PAYMENT"
                                      ? " · awaiting payment"
                                      : ""}
                                  </p>
                                ) : null}

                                <div
                                  className={cn(
                                    "grid gap-3 md:max-w-3xl",
                                    member.rosterRole === "COACH"
                                      ? "md:grid-cols-2 lg:grid-cols-4"
                                      : "md:grid-cols-3",
                                  )}
                                >
                                  <div className="flex flex-col gap-1.5">
                                    <Label
                                      htmlFor={`number-${member.id}`}
                                      className="mb-0 text-xs font-normal text-zinc-500"
                                    >
                                      {member.rosterRole === "COACH"
                                        ? "VLYC coach number"
                                        : "VLY number"}
                                    </Label>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        id={`number-${member.id}`}
                                        value={
                                          memberNumberDrafts[member.id] ??
                                          member.vlyNumber
                                        }
                                        disabled={loading}
                                        onChange={(event) => {
                                          setMemberNumberDrafts((current) => ({
                                            ...current,
                                            [member.id]:
                                              event.target.value.toUpperCase(),
                                          }));
                                          setSavedMemberNumberById((current) => {
                                            if (!current[member.id]) return current;
                                            const next = { ...current };
                                            delete next[member.id];
                                            return next;
                                          });
                                        }}
                                        placeholder={
                                          member.rosterRole === "COACH"
                                            ? "VLYC12345"
                                            : "VLY12345"
                                        }
                                        className="py-2 text-sm"
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        disabled={
                                          loading ||
                                          savingMemberNumberId === member.id
                                        }
                                        onClick={() => saveMemberNumber(member)}
                                        className={cn(
                                          "shrink-0",
                                          savedMemberNumberById[member.id]
                                            ? "border border-green-500/40 bg-green-500/20 text-green-300 hover:border-green-500 hover:bg-green-500/25 hover:text-green-200"
                                            : "border border-zinc-400/35 bg-zinc-600/15 text-zinc-100 hover:border-zinc-300/45 hover:bg-zinc-600/25 hover:text-white",
                                        )}
                                      >
                                        {savingMemberNumberId === member.id
                                          ? "Saving..."
                                          : savedMemberNumberById[member.id]
                                            ? "Saved"
                                            : "Save"}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <Label
                                      htmlFor={`role-${member.id}`}
                                      className="mb-0 text-xs font-normal text-zinc-500"
                                    >
                                      Roster role
                                    </Label>
                                    <Select
                                      id={`role-${member.id}`}
                                      value={member.rosterRole}
                                      disabled={loading}
                                      onChange={(event) =>
                                        assignRosterRole(
                                          member,
                                          event.target.value as "PLAYER" | "COACH",
                                        )
                                      }
                                    >
                                      <option value="PLAYER">Player</option>
                                      <option value="COACH">Coach</option>
                                    </Select>
                                  </div>

                                  {member.rosterRole === "COACH" ? (
                                    <div className="flex flex-col gap-1.5">
                                      <Label
                                        htmlFor={`coach-type-${member.id}`}
                                        className="mb-0 text-xs font-normal text-zinc-500"
                                      >
                                        Coach type
                                      </Label>
                                      <Select
                                        id={`coach-type-${member.id}`}
                                        value={member.coachPaymentType ?? "PAID"}
                                        disabled={loading}
                                        onChange={(event) =>
                                          assignCoachPaymentType(
                                            member,
                                            event.target.value as CoachPaymentType,
                                          )
                                        }
                                      >
                                        {COACH_PAYMENT_TYPES.map((type) => (
                                          <option key={type} value={type}>
                                            {COACH_PAYMENT_TYPE_LABELS[type]}
                                          </option>
                                        ))}
                                      </Select>
                                    </div>
                                  ) : null}

                                  <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-1">
                                    <Label className="mb-0 text-xs font-normal text-zinc-500">
                                      {member.rosterRole === "COACH"
                                        ? "Squads"
                                        : "Squad"}
                                    </Label>
                                    {member.rosterRole === "COACH" ? (
                                      <SquadCheckboxGroup
                                        idPrefix={`team-${member.id}`}
                                        selectedKeys={memberSquadKeys(member)}
                                        trainingTeams={trainingTeams}
                                        disabled={loading}
                                        onChange={(keys) =>
                                          assignCoachSquads(member, keys)
                                        }
                                      />
                                    ) : (
                                      <Select
                                        id={`team-${member.id}`}
                                        value={member.trainingTeamKey ?? ""}
                                        disabled={loading}
                                        className="py-2 text-sm"
                                        onChange={(event) =>
                                          assignTeam(member, event.target.value)
                                        }
                                      >
                                        <option value="">No squad assigned</option>
                                        {trainingTeams.map((team) => (
                                          <option key={team.key} value={team.key}>
                                            {team.name}
                                          </option>
                                        ))}
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
