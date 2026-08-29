"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
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
  vlyNumber: string | null;
  name: string;
  active: boolean;
  rosterRole: string;
  coachPaymentType: CoachPaymentType | null;
  trainingTeamKey: string | null;
  trainingTeamKeys: string[];
  coachSquadPriorities?: Record<string, number>;
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

const HEAD_COACH_PRIORITY = 0;
const COVER_COACH_PRIORITY = 100;

const emptyForm = {
  vlyNumber: "",
  name: "",
  trainingTeamKey: "",
  trainingTeamKeys: [] as string[],
  coachSquadPriorities: {} as Record<string, number>,
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

function memberCoachPriorities(member: ClubMember): Record<string, number> {
  return member.coachSquadPriorities ?? {};
}

function isHeadCoachForSquad(member: ClubMember, trainingTeamKey: string) {
  return (memberCoachPriorities(member)[trainingTeamKey] ?? COVER_COACH_PRIORITY) ===
    HEAD_COACH_PRIORITY;
}

function memberSquadLabel(
  member: ClubMember,
  trainingTeams: TrainingTeam[],
) {
  const keys = memberSquadKeys(member);
  if (keys.length === 0) {
    return member.rosterRole === "COACH" ? "No squads (not covering)" : "Unassigned";
  }
  return keys
    .map((key) => {
      const name = getTrainingTeamFromList(trainingTeams, key)?.name ?? key;
      if (member.rosterRole !== "COACH") return name;
      return isHeadCoachForSquad(member, key)
        ? `${name} · head`
        : `${name} · cover`;
    })
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
  priorities,
  trainingTeams,
  disabled,
  onToggle,
  onPriorityChange,
  idPrefix,
  showHeadCoachControls,
  headBySquad = {},
  currentMemberId,
}: {
  selectedKeys: string[];
  priorities?: Record<string, number>;
  trainingTeams: TrainingTeam[];
  disabled?: boolean;
  /** Toggle one squad on/off — parent should derive next keys from latest state. */
  onToggle: (trainingTeamKey: string) => void;
  onPriorityChange?: (trainingTeamKey: string, priority: number) => void;
  idPrefix: string;
  showHeadCoachControls?: boolean;
  /** Current head coach per squad key (at most one). */
  headBySquad?: Record<string, { id: string; name: string } | null>;
  /** When editing an existing coach, their id — used to label “you”. */
  currentMemberId?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Tick squads this coach is on. Each squad can have one head coach and as
        many cover coaches as you need. Leave all unchecked if they should not
        cover any team yet.
      </p>
      <div
        className={cn(
          "gap-2",
          showHeadCoachControls
            ? "grid sm:grid-cols-2 xl:grid-cols-3"
            : "space-y-2",
        )}
      >
        {trainingTeams.map((team) => {
          const checked = selectedKeys.includes(team.key);
          const isHead =
            (priorities?.[team.key] ?? COVER_COACH_PRIORITY) ===
            HEAD_COACH_PRIORITY;
          const currentHead = headBySquad[team.key] ?? null;
          const otherHead =
            currentHead && currentHead.id !== currentMemberId
              ? currentHead
              : null;

          return (
            <div
              key={team.key}
              className={cn(
                "rounded-md border px-3 py-2.5 transition",
                checked
                  ? "border-jackals-red/40 bg-jackals-red/10"
                  : "border-white/10 bg-white/[0.02]",
                disabled && "opacity-60",
              )}
            >
              <label
                htmlFor={`${idPrefix}-${team.key}`}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 text-sm",
                  checked ? "text-white" : "text-zinc-400",
                  disabled && "cursor-not-allowed",
                )}
              >
                <input
                  id={`${idPrefix}-${team.key}`}
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-black/20 text-jackals-red focus:ring-jackals-red/40"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    if (disabled) return;
                    onToggle(team.key);
                  }}
                />
                <span className="font-medium">{team.name}</span>
              </label>

              {showHeadCoachControls && checked && onPriorityChange ? (
                <div className="mt-2 ml-6 space-y-2">
                  <div
                    className="flex flex-wrap gap-2"
                    role="group"
                    aria-label={`Role on ${team.name}`}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        onPriorityChange(team.key, HEAD_COACH_PRIORITY)
                      }
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        isHead
                          ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                          : "border-white/15 text-zinc-400 hover:border-white/25 hover:text-white",
                        disabled && "cursor-not-allowed",
                      )}
                    >
                      Head coach
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        onPriorityChange(team.key, COVER_COACH_PRIORITY)
                      }
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                        !isHead
                          ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                          : "border-white/15 text-zinc-400 hover:border-white/25 hover:text-white",
                        disabled && "cursor-not-allowed",
                      )}
                    >
                      Cover coach
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {isHead
                      ? "This coach is the head for this squad (only one allowed)."
                      : otherHead
                        ? `Current head: ${otherHead.name}. Choosing Head coach moves them to cover.`
                        : "No head coach set for this squad yet."}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {showHeadCoachControls && selectedKeys.length > 0 ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Head coach responds first for that squad. If they decline, cover
          coaches get an email and can accept (only one cover at a time).
        </p>
      ) : null}
      {showHeadCoachControls && selectedKeys.length === 0 ? (
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Not assigned to any squad — they will not appear in session cover
          flows until you add them to a team.
        </p>
      ) : null}
    </div>
  );
}

function buildHeadBySquad(
  clubMembers: ClubMember[],
): Record<string, { id: string; name: string } | null> {
  const heads: Record<string, { id: string; name: string }> = {};
  for (const member of clubMembers) {
    if (member.rosterRole !== "COACH" || !member.active) continue;
    for (const key of memberSquadKeys(member)) {
      if (!isHeadCoachForSquad(member, key)) continue;
      // Keep the first head found; backend enforces uniqueness.
      if (!heads[key]) {
        heads[key] = { id: member.id, name: member.name };
      }
    }
  }
  return heads;
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
  const [savingSquadMemberId, setSavingSquadMemberId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
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

  /** Latest squad keys per coach — avoids stale checkbox races when ticking several teams quickly. */
  const latestCoachSquadKeysRef = useRef<Record<string, string[]>>({});
  const coachSquadSaveChainRef = useRef<
    Partial<Record<string, Promise<void>>>
  >({});
  const pendingCoachSquadSaveRef = useRef<
    Partial<
      Record<
        string,
        {
          keys: string[];
          priorities: Record<string, number>;
          successMessage?: string;
        }
      >
    >
  >({});

  const headBySquad = useMemo(
    () => buildHeadBySquad(clubMembers),
    [clubMembers],
  );

  useEffect(() => {
    for (const member of clubMembers) {
      if (member.rosterRole !== "COACH") continue;
      // Don't clobber in-flight optimistic keys with a slower server refresh.
      if (pendingCoachSquadSaveRef.current[member.id]) continue;
      latestCoachSquadKeysRef.current[member.id] = memberSquadKeys(member);
    }
  }, [clubMembers]);

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
        member.vlyNumber ?? "",
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
    setFormError(null);
    setFormMessage(null);
    setError(null);
    setMessage(null);

    const payload =
      form.rosterRole === "COACH"
        ? {
            ...form,
            trainingTeamKeys: form.trainingTeamKeys,
            trainingTeamKey: undefined,
            coachSquadPriorities: Object.fromEntries(
              form.trainingTeamKeys.map((key) => [
                key,
                form.coachSquadPriorities[key] ?? COVER_COACH_PRIORITY,
              ]),
            ),
          }
        : {
            vlyNumber: form.vlyNumber,
            name: form.name,
            trainingTeamKey: form.trainingTeamKey,
            rosterRole: form.rosterRole,
          };

    const result = await apiPost(
      "/api/admin/club-members",
      payload,
      "Failed to add club member",
    );

    setLoading(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setForm(emptyForm);
    setFormMessage("Club member added");
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

  const assignCoachSquads = async (
    member: ClubMember,
    trainingTeamKeys: string[],
    coachSquadPriorities?: Record<string, number>,
    successMessage?: string,
  ) => {
    const priorities =
      coachSquadPriorities ??
      Object.fromEntries(
        trainingTeamKeys.map((key) => [
          key,
          memberCoachPriorities(member)[key] ??
            pendingCoachSquadSaveRef.current[member.id]?.priorities[key] ??
            COVER_COACH_PRIORITY,
        ]),
      );

    latestCoachSquadKeysRef.current[member.id] = trainingTeamKeys;
    pendingCoachSquadSaveRef.current[member.id] = {
      keys: trainingTeamKeys,
      priorities,
      successMessage,
    };

    // Optimistic UI so ticks respond immediately.
    setClubMembers((current) =>
      current.map((row) =>
        row.id !== member.id
          ? row
          : {
              ...row,
              trainingTeamKeys,
              trainingTeamKey: trainingTeamKeys[0] ?? null,
              coachSquadPriorities: priorities,
            },
      ),
    );
    setError(null);
    if (successMessage) setMessage(successMessage);
    else setMessage(null);
    setSavingSquadMemberId(member.id);

    if (coachSquadSaveChainRef.current[member.id]) {
      return coachSquadSaveChainRef.current[member.id];
    }

    const run = async () => {
      while (pendingCoachSquadSaveRef.current[member.id]) {
        const payload = pendingCoachSquadSaveRef.current[member.id]!;
        const snapshot = {
          keys: [...payload.keys],
          priorities: { ...payload.priorities },
          successMessage: payload.successMessage,
        };

        const result = await apiPatch(
          `/api/admin/club-members/${member.id}`,
          {
            trainingTeamKeys: snapshot.keys,
            coachSquadPriorities: snapshot.priorities,
          },
          "Failed to assign coach squads",
        );

        const latest = pendingCoachSquadSaveRef.current[member.id];
        const changedWhileSaving =
          latest &&
          (latest.keys.join("\0") !== snapshot.keys.join("\0") ||
            JSON.stringify(latest.priorities) !==
              JSON.stringify(snapshot.priorities));

        if (!result.ok) {
          const latestAfterFail = pendingCoachSquadSaveRef.current[member.id];
          const stillSameSnapshot =
            latestAfterFail &&
            latestAfterFail.keys.join("\0") === snapshot.keys.join("\0") &&
            JSON.stringify(latestAfterFail.priorities) ===
              JSON.stringify(snapshot.priorities);
          if (stillSameSnapshot) {
            delete pendingCoachSquadSaveRef.current[member.id];
          }
          setError(result.error);
          await loadClubMembers();
          // Newer toggles queued during the failed request — keep looping.
          if (!stillSameSnapshot && pendingCoachSquadSaveRef.current[member.id]) {
            continue;
          }
          return;
        }

        if (snapshot.successMessage) setMessage(snapshot.successMessage);

        if (changedWhileSaving) {
          continue;
        }

        delete pendingCoachSquadSaveRef.current[member.id];
        await loadClubMembers();
        return;
      }
    };

    const next = run().finally(() => {
      delete coachSquadSaveChainRef.current[member.id];
      setSavingSquadMemberId((current) =>
        current === member.id ? null : current,
      );
    });
    coachSquadSaveChainRef.current[member.id] = next;
    await next;
  };

  const toggleCoachSquad = (member: ClubMember, trainingTeamKey: string) => {
    const current =
      latestCoachSquadKeysRef.current[member.id] ?? memberSquadKeys(member);
    const next = current.includes(trainingTeamKey)
      ? current.filter((key) => key !== trainingTeamKey)
      : [...current, trainingTeamKey];
    latestCoachSquadKeysRef.current[member.id] = next;

    const priorities = Object.fromEntries(
      next.map((key) => [
        key,
        memberCoachPriorities(member)[key] ??
          pendingCoachSquadSaveRef.current[member.id]?.priorities[key] ??
          COVER_COACH_PRIORITY,
      ]),
    );

    void assignCoachSquads(member, next, priorities);
  };

  const assignCoachSquadPriority = async (
    member: ClubMember,
    trainingTeamKey: string,
    priority: number,
  ) => {
    const keys =
      latestCoachSquadKeysRef.current[member.id] ?? memberSquadKeys(member);
    if (!keys.includes(trainingTeamKey)) return;

    const nextPriorities = {
      ...Object.fromEntries(
        keys.map((key) => [
          key,
          memberCoachPriorities(member)[key] ??
            pendingCoachSquadSaveRef.current[member.id]?.priorities[key] ??
            COVER_COACH_PRIORITY,
        ]),
      ),
      [trainingTeamKey]: priority,
    };

    const teamName =
      getTrainingTeamFromList(trainingTeams, trainingTeamKey)?.name ??
      trainingTeamKey;
    const previousHead = headBySquad[trainingTeamKey];
    let successMessage: string | undefined;

    if (priority === HEAD_COACH_PRIORITY) {
      successMessage =
        previousHead && previousHead.id !== member.id
          ? `${member.name} is now head coach for ${teamName}. ${previousHead.name} moved to cover.`
          : `${member.name} is now head coach for ${teamName}.`;
    } else {
      const wasHead =
        (memberCoachPriorities(member)[trainingTeamKey] ??
          COVER_COACH_PRIORITY) === HEAD_COACH_PRIORITY ||
        (pendingCoachSquadSaveRef.current[member.id]?.priorities[
          trainingTeamKey
        ] ?? COVER_COACH_PRIORITY) === HEAD_COACH_PRIORITY;
      if (wasHead) {
        successMessage = `${member.name} is now a cover coach for ${teamName}.`;
      }
    }

    await assignCoachSquads(member, keys, nextPriorities, successMessage);
  };

  const saveMemberNumber = async (member: ClubMember) => {
    const draft = memberNumberDrafts[member.id];
    if (draft === undefined) return;

    const normalized = draft.trim().toUpperCase().replace(/\s+/g, "");
    const nextValue = normalized.length > 0 ? normalized : null;
    if (nextValue === (member.vlyNumber ?? null)) {
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
      { vlyNumber: nextValue },
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
    setMessage(
      nextValue
        ? "Member number updated"
        : "Member number cleared — they can add it later on their profile",
    );
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
      description="Players and coaches on the roster — assign coaches to squads as head or cover (or leave them off a team). VLY/VLYC can be blank until issued."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add club member entry"
        title="Add club member entry"
        error={formError}
        message={formMessage}
        onSubmit={addMember}
        submitLabel={loading ? "Saving..." : "Add club member"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="roster-vly">
              {form.rosterRole === "COACH" ? "VLYC coach number" : "VLY number"}{" "}
              <span className="font-normal text-zinc-500">(optional for now)</span>
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
              placeholder={
                form.rosterRole === "COACH"
                  ? "VLYC12345 — leave blank if not issued yet"
                  : "VLY12345 — leave blank if not issued yet"
              }
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
              {form.rosterRole === "COACH"
                ? "Training squads (head & cover)"
                : "Team"}
            </Label>
            {form.rosterRole === "COACH" ? (
              <>
                <SquadCheckboxGroup
                  idPrefix="roster-add"
                  selectedKeys={form.trainingTeamKeys}
                  priorities={form.coachSquadPriorities}
                  trainingTeams={trainingTeams}
                  disabled={loading}
                  showHeadCoachControls
                  headBySquad={headBySquad}
                  onToggle={(trainingTeamKey) =>
                    setForm((current) => {
                      const selected = current.trainingTeamKeys.includes(
                        trainingTeamKey,
                      );
                      const trainingTeamKeys = selected
                        ? current.trainingTeamKeys.filter(
                            (key) => key !== trainingTeamKey,
                          )
                        : [...current.trainingTeamKeys, trainingTeamKey];
                      const nextPriorities = { ...current.coachSquadPriorities };
                      for (const key of Object.keys(nextPriorities)) {
                        if (!trainingTeamKeys.includes(key)) {
                          delete nextPriorities[key];
                        }
                      }
                      for (const key of trainingTeamKeys) {
                        if (nextPriorities[key] === undefined) {
                          nextPriorities[key] = COVER_COACH_PRIORITY;
                        }
                      }
                      return {
                        ...current,
                        trainingTeamKeys,
                        coachSquadPriorities: nextPriorities,
                      };
                    })
                  }
                  onPriorityChange={(trainingTeamKey, priority) =>
                    setForm((current) => ({
                      ...current,
                      coachSquadPriorities: {
                        ...current.coachSquadPriorities,
                        [trainingTeamKey]: priority,
                      },
                    }))
                  }
                />
                {form.trainingTeamKeys.length === 0 ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Optional — leave empty if this coach should not cover any
                    squad yet.
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
              onChange={(event) => {
                const rosterRole = event.target.value as "PLAYER" | "COACH";
                setFormError(null);
                setForm((current) => ({
                  ...current,
                  rosterRole,
                  // Avoid carrying a player VLY into a coach create (and vice versa).
                  vlyNumber: "",
                  trainingTeamKeys:
                    rosterRole === "COACH"
                      ? current.trainingTeamKey
                        ? [current.trainingTeamKey]
                        : current.trainingTeamKeys
                      : [],
                  trainingTeamKey:
                    rosterRole === "PLAYER"
                      ? current.trainingTeamKeys[0] ?? current.trainingTeamKey
                      : current.trainingTeamKey,
                }));
              }}
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

      <SuccessBanner message={message} />
      <FormError message={error} />

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

                      <div className="space-y-2">
                        <Label className="mb-0 text-xs font-normal text-zinc-500">
                          Roster role
                        </Label>
                        <Select
                          value={member.rosterRole}
                          disabled={loading}
                          onChange={(event) =>
                            void assignRosterRole(
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
                        <div className="space-y-2">
                          <Label className="mb-0 text-xs font-normal text-zinc-500">
                            Training squads (head & cover)
                          </Label>
                          <SquadCheckboxGroup
                            idPrefix={`mobile-team-${member.id}`}
                            selectedKeys={memberSquadKeys(member)}
                            priorities={memberCoachPriorities(member)}
                            trainingTeams={trainingTeams}
                            disabled={loading}
                            showHeadCoachControls
                            headBySquad={headBySquad}
                            currentMemberId={member.id}
                            onToggle={(key) => toggleCoachSquad(member, key)}
                            onPriorityChange={(key, priority) =>
                              void assignCoachSquadPriority(
                                member,
                                key,
                                priority,
                              )
                            }
                          />
                          {savingSquadMemberId === member.id ? (
                            <p className="text-[11px] text-zinc-500">
                              Saving squads…
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="mb-0 text-xs font-normal text-zinc-500">
                            Squad
                          </Label>
                          <Select
                            value={member.trainingTeamKey ?? ""}
                            disabled={loading}
                            onChange={(event) =>
                              void assignTeam(member, event.target.value)
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
                      )}

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
                            <div className="space-y-4">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                <div className="flex shrink-0 flex-wrap items-start gap-3">
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

                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <p className="text-sm text-zinc-400">
                                    <span className="text-zinc-500">VLY:</span>{" "}
                                    {member.vlyNumber ?? (
                                      <span className="text-zinc-500">
                                        Not set yet
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    <span className="text-zinc-500">Squad:</span>{" "}
                                    {squadLabel}
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    <span className="text-zinc-500">Email:</span>{" "}
                                    {member.user?.email ??
                                      "Awaiting registration"}
                                  </p>
                                  {subscriptionLabel ? (
                                    <p className="text-xs font-medium text-zinc-300">
                                      {subscriptionLabel}
                                      {subscription?.status === "PENDING_PAYMENT"
                                        ? " · awaiting payment"
                                        : ""}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                className={cn(
                                  "grid gap-3",
                                  member.rosterRole === "COACH"
                                    ? "sm:grid-cols-2 lg:grid-cols-3"
                                    : "sm:grid-cols-2 lg:grid-cols-3",
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
                                          member.vlyNumber ??
                                          ""
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
                                            ? "VLYC12345 (optional)"
                                            : "VLY12345 (optional)"
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
                                  ) : (
                                    <div className="flex flex-col gap-1.5">
                                      <Label className="mb-0 text-xs font-normal text-zinc-500">
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
                                  )}
                              </div>

                              {member.rosterRole === "COACH" ? (
                                <div className="space-y-2 border-t border-white/10 pt-4">
                                  <Label className="mb-0 text-xs font-normal text-zinc-500">
                                    Training squads (head & cover)
                                  </Label>
                                  <SquadCheckboxGroup
                                    idPrefix={`team-${member.id}`}
                                    selectedKeys={memberSquadKeys(member)}
                                    priorities={memberCoachPriorities(member)}
                                    trainingTeams={trainingTeams}
                                    disabled={loading}
                                    showHeadCoachControls
                                    headBySquad={headBySquad}
                                    currentMemberId={member.id}
                                    onToggle={(key) =>
                                      toggleCoachSquad(member, key)
                                    }
                                    onPriorityChange={(key, priority) =>
                                      void assignCoachSquadPriority(
                                        member,
                                        key,
                                        priority,
                                      )
                                    }
                                  />
                                  {savingSquadMemberId === member.id ? (
                                    <p className="text-[11px] text-zinc-500">
                                      Saving squads…
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
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
