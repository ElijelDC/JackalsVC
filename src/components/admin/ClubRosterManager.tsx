"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { AdminMemberProfileImage } from "@/components/admin/AdminMemberProfileImage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/client-api";
import {
  formatMembershipSubscriptionLabel,
} from "@/lib/membership-config";
import {
  getTrainingTeamFromList,
  type TrainingTeam,
} from "@/lib/training-teams-config";

type ClubMember = {
  id: string;
  vlyNumber: string;
  name: string;
  active: boolean;
  rosterRole: string;
  trainingTeamKey: string | null;
  profileImageUrl: string | null;
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
  rosterRole: "PLAYER",
};

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
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");

  const filteredMembers = useMemo(() => {
    const filtered = clubMembers.filter((member) => {
      if (teamFilter !== "all") {
        if (teamFilter === "unassigned") {
          if (member.trainingTeamKey) return false;
        } else if (member.trainingTeamKey !== teamFilter) {
          return false;
        }
      }

      return matchesAdminSearch(
        search,
        member.vlyNumber,
        member.name,
        member.user?.email ?? "",
        member.active ? "active" : "inactive",
        getTrainingTeamFromList(trainingTeams, member.trainingTeamKey)?.name ?? "",
      );
    });

    return [...filtered].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
      return sortBy === "name_asc" ? comparison : -comparison;
    });
  }, [clubMembers, search, teamFilter, sortBy]);

  const hasActiveFilters =
    search.trim().length > 0 || teamFilter !== "all" || sortBy !== "name_asc";

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

    const result = await apiPost(
      "/api/admin/club-members",
      form,
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

    const result = await apiPatch(
      `/api/admin/club-members/${member.id}`,
      { active: !member.active },
      "Failed to update roster entry",
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

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
            <Label htmlFor="roster-vly">VLY number</Label>
            <Input
              id="roster-vly"
              value={form.vlyNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  vlyNumber: event.target.value.toUpperCase(),
                }))
              }
              placeholder="VLY12345"
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
            <Label htmlFor="roster-team">Team</Label>
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
                }))
              }
              required
            >
              <option value="PLAYER">Player</option>
              <option value="COACH">Coach</option>
            </Select>
          </div>
        </div>
      </AdminFormCard>

      <div className="mt-6">
        <div className="space-y-4">
          <AdminSearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search VLY number, name, team, or email..."
          />

          <div className="grid gap-4 sm:grid-cols-2">
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
                  setSortBy("name_asc");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredMembers.map((member) => {
            const subscription = member.userId
              ? subscriptionByUserId[member.userId]
              : undefined;
            const subscriptionLabel = subscription
              ? formatMembershipSubscriptionLabel(
                  subscription.planName,
                  subscription.paymentSchedule,
                )
              : null;

            return (
              <Card
                key={member.id}
                className="overflow-hidden p-0 transition-colors hover:border-white/15"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5">
                  <AdminMemberProfileImage
                    memberId={member.id}
                    name={member.name}
                    imageUrl={member.profileImageUrl}
                    disabled={loading}
                    onUpdated={loadClubMembers}
                  />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="truncate font-medium text-white">
                            {member.name}
                          </h3>
                          <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-sm font-medium tracking-wide text-zinc-100">
                            {member.vlyNumber}
                          </span>
                          <Badge
                            className={
                              member.rosterRole === "COACH"
                                ? "border border-blue-500/30 bg-blue-500/10 text-blue-300"
                                : "border border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                            }
                          >
                            {member.rosterRole === "COACH" ? "Coach" : "Player"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-sm text-zinc-400">
                          {member.user ? (
                            member.user.email
                          ) : (
                            <span className="italic text-zinc-500">
                              Awaiting registration
                            </span>
                          )}
                        </p>
                        {subscriptionLabel && (
                          <p className="mt-1 text-xs font-medium text-jackals-red-light">
                            {subscriptionLabel}
                            {subscription?.status === "PENDING_PAYMENT"
                              ? " · awaiting payment"
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          className={
                            member.active
                              ? "border border-green-500/25 bg-green-500/10 text-green-400"
                              : "border border-zinc-500/25 bg-zinc-500/10 text-zinc-400"
                          }
                        >
                          {member.active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={loading}
                          onClick={() => toggleActive(member)}
                          className="text-zinc-400 hover:text-white"
                        >
                          {member.active ? "Deactivate" : "Activate"}
                        </Button>
                        {!member.userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading}
                            onClick={() => removeMember(member)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 sm:max-w-md">
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
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={`team-${member.id}`}
                          className="mb-0 text-xs font-normal text-zinc-500"
                        >
                          Squad
                        </Label>
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
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {filteredMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              {search.trim() || teamFilter !== "all"
                ? "No roster entries match your filters."
                : "No roster entries yet."}
            </p>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
