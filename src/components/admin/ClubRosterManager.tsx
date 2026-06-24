"use client";

import { useCallback, useMemo, useState } from "react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminBulkCsvImport } from "@/components/admin/AdminBulkCsvImport";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { AdminMemberProfileImage } from "@/components/admin/AdminMemberProfileImage";
import { AdminMemberVlyPhoto } from "@/components/admin/AdminMemberVlyPhoto";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  rosterRole: "PLAYER",
  coachPaymentType: "PAID" as CoachPaymentType,
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
  const [memberFilter, setMemberFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [memberNumberDrafts, setMemberNumberDrafts] = useState<Record<string, string>>({});
  const [savingMemberNumberId, setSavingMemberNumberId] = useState<string | null>(null);
  const [savedMemberNumberById, setSavedMemberNumberById] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");

  const filteredMembers = useMemo(() => {
    const filtered = clubMembers.filter((member) => {
      if (memberFilter === "awaiting-registration-players") {
        if (member.userId || member.rosterRole !== "PLAYER") {
          return false;
        }
      }

      if (roleFilter !== "all" && member.rosterRole !== roleFilter) {
        return false;
      }

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
  }, [clubMembers, search, teamFilter, memberFilter, roleFilter, sortBy]);

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

      <div className="mb-8 mt-6">
        <AdminBulkCsvImport type="roster" />
      </div>

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
                <option value="awaiting-registration-players">
                  Awaiting Registration players
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

        <div className="mt-4 space-y-3">
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

            return (
              <Card
                key={member.id}
                className="overflow-hidden p-0 transition-colors hover:border-white/15"
              >
                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:gap-4">
                  <div className="flex flex-wrap items-start gap-3 md:shrink-0 md:flex-nowrap">
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
                                ? "border border-zinc-400/30 bg-zinc-500/10 text-zinc-200"
                                : "border border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
                            }
                          >
                            {member.rosterRole === "COACH" ? "Coach" : "Player"}
                          </Badge>
                          {member.rosterRole === "COACH" && member.coachPaymentType && (
                            <Badge
                              className={
                                member.coachPaymentType === "PAID"
                                  ? "border border-zinc-400/30 bg-zinc-500/10 text-zinc-200"
                                  : "border border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
                              }
                            >
                              {COACH_PAYMENT_TYPE_LABELS[member.coachPaymentType]}
                            </Badge>
                          )}
                          <Badge
                            className={
                              member.active
                                ? "border border-green-500/35 bg-green-500/15 text-green-300 font-semibold tracking-wide"
                                : "border border-red-500/35 bg-red-500/15 text-red-300"
                            }
                          >
                            {member.active ? "Active" : "Inactive"}
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
                          <p
                            className={cn(
                              "mt-1 text-xs font-medium",
                              "text-zinc-300",
                            )}
                          >
                            {subscriptionLabel}
                            {subscription?.status === "PENDING_PAYMENT"
                              ? " · awaiting payment"
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loading}
                          onClick={() => toggleActive(member)}
                          className={cn(
                            "border font-medium",
                            member.active
                              ? "px-2 py-1 text-xs border-red-500/40 bg-red-500/15 text-red-300 hover:border-red-500 hover:bg-red-500/25 hover:text-red-200"
                              : "border-green-500/40 bg-green-500/15 text-green-300 hover:border-green-500 hover:bg-green-500/25 hover:text-green-200",
                          )}
                        >
                          {member.active ? "Deactivate" : "Activate"}
                        </Button>
                        {!member.userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={loading}
                            onClick={() => removeMember(member)}
                            className="text-zinc-400 hover:text-zinc-200"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "grid gap-3 md:max-w-xl",
                        member.rosterRole === "COACH" ? "md:grid-cols-4" : "md:grid-cols-3",
                      )}
                    >
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={`number-${member.id}`}
                          className="mb-0 text-xs font-normal text-zinc-500"
                        >
                          {member.rosterRole === "COACH" ? "VLYC coach number" : "VLY number"}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`number-${member.id}`}
                            value={memberNumberDrafts[member.id] ?? member.vlyNumber}
                            disabled={loading}
                            onChange={(event) =>
                              {
                                setMemberNumberDrafts((current) => ({
                                  ...current,
                                  [member.id]: event.target.value.toUpperCase(),
                                }));
                                setSavedMemberNumberById((current) => {
                                  if (!current[member.id]) return current;
                                  const next = { ...current };
                                  delete next[member.id];
                                  return next;
                                });
                              }
                            }
                            placeholder={
                              member.rosterRole === "COACH" ? "VLYC12345" : "VLY12345"
                            }
                            className="py-2 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={loading || savingMemberNumberId === member.id}
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
                      {member.rosterRole === "COACH" && (
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
                      )}
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
              {search.trim() || teamFilter !== "all" || memberFilter !== "all" || roleFilter !== "all"
                ? "No roster entries match your filters."
                : "No roster entries yet."}
            </p>
          )}
        </div>
      </div>
    </AdminSection>
  );
}
