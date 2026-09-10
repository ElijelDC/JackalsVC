"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addDays, format } from "date-fns";
import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { AdminBulkCsvImport } from "@/components/admin/AdminBulkCsvImport";
import { AdminMemberProfileImage } from "@/components/admin/AdminMemberProfileImage";
import { AdminMemberVlyPhoto } from "@/components/admin/AdminMemberVlyPhoto";
import { AdminSection } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormError, SuccessBanner } from "@/components/ui/FormMessage";
import { Checkbox, Input, Label, Select } from "@/components/ui/Input";
import { apiDelete, apiPatch, apiPost, apiPut } from "@/lib/client-api";
import {
  ADMIN_MEMBERS_SQUAD_FILTERS,
  matchesAdminMembersSquadFilter,
  squadShortLabel,
  type AdminMembersFocus,
  type AdminMembersMembership,
  type AdminMembersPlan,
  type AdminMembersTrainingTeam,
  type AdminMembersSquadFilter,
  type AdminPersonRow,
} from "@/lib/admin-members-hub";
import {
  COACH_PAYMENT_TYPE_LABELS,
  type CoachPaymentType,
} from "@/lib/coach-payment-type";
import {
  formatMembershipStatusLabel,
  isAdminMembershipStatus,
  ADMIN_MEMBERSHIP_STATUSES,
  type AdminMembershipStatus,
} from "@/lib/membership-status";
import {
  formatPaymentScheduleLabel,
  type PaymentSchedule,
  PAYMENT_SCHEDULES,
} from "@/lib/membership-config";
import { assessMembershipPaymentAccess } from "@/lib/membership-overdue";
import {
  PLAYER_PAYMENT_TYPE_LABELS,
  type PlayerPaymentType,
} from "@/lib/player-payment-type";
import { cn, formatPrice } from "@/lib/utils";

const HEAD_COACH_PRIORITY = 0;
const COVER_COACH_PRIORITY = 100;

type RoleFilter = "ALL" | "PLAYER" | "COACH" | "ACCOUNT";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "AWAITING" | "PAYG" | "OVERDUE";

function scheduleLabel(schedule: string) {
  return PAYMENT_SCHEDULES.includes(schedule as PaymentSchedule)
    ? formatPaymentScheduleLabel(schedule as PaymentSchedule)
    : schedule;
}

function membershipStatusOptions(currentStatus: string): string[] {
  if (isAdminMembershipStatus(currentStatus)) {
    return [...ADMIN_MEMBERSHIP_STATUSES];
  }
  return [currentStatus, ...ADMIN_MEMBERSHIP_STATUSES];
}

function isMembershipOverdue(membership: AdminMembersMembership | null) {
  if (!membership) return false;
  const access = assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: membership.paymentOverdueOverride,
    paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil
      ? new Date(membership.paymentOverdueOverrideUntil)
      : null,
    payments: membership.payments.map((payment) => ({
      status: payment.status,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : null,
      amount: payment.amount,
      installmentNumber: payment.installmentNumber,
    })),
  });
  return access.isOverdue;
}

export function AdminMembersHub({
  initialPeople,
  plans,
  trainingTeams,
  initialFocus = "account",
}: {
  initialPeople: AdminPersonRow[];
  plans: AdminMembersPlan[];
  trainingTeams: AdminMembersTrainingTeam[];
  initialFocus?: AdminMembersFocus;
}) {
  const router = useRouter();
  const [people, setPeople] = useState(initialPeople);
  const [search, setSearch] = useState("");
  const [squadFilter, setSquadFilter] = useState<AdminMembersSquadFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [focusSection, setFocusSection] =
    useState<AdminMembersFocus>(initialFocus);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    vlyNumber: "",
    rosterRole: "PLAYER" as "PLAYER" | "COACH",
    trainingTeamKey: "",
    playerPaymentType: "MEMBERSHIP" as PlayerPaymentType,
  });

  useEffect(() => {
    setPeople(initialPeople);
  }, [initialPeople]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return people.filter((person) => {
      const keys = person.clubMember?.trainingTeamKeys ?? [];
      if (!matchesAdminMembersSquadFilter(keys, squadFilter)) return false;

      if (roleFilter === "PLAYER" && person.clubMember?.rosterRole !== "PLAYER") {
        return false;
      }
      if (roleFilter === "COACH" && person.clubMember?.rosterRole !== "COACH") {
        return false;
      }
      if (roleFilter === "ACCOUNT" && person.kind !== "account_only") {
        return false;
      }

      if (statusFilter === "ACTIVE" && person.clubMember && !person.clubMember.active) {
        return false;
      }
      if (statusFilter === "INACTIVE" && (!person.clubMember || person.clubMember.active)) {
        return false;
      }
      if (statusFilter === "AWAITING" && person.clubMember?.userId) {
        return false;
      }
      if (statusFilter === "AWAITING" && !person.clubMember) {
        return false;
      }
      if (
        statusFilter === "PAYG" &&
        person.clubMember?.playerPaymentType !== "PAYG"
      ) {
        return false;
      }
      if (
        statusFilter === "OVERDUE" &&
        !isMembershipOverdue(person.currentMembership) &&
        person.currentMembership?.status !== "ARREARS"
      ) {
        return false;
      }

      if (!query) return true;
      const haystack = [
        person.name,
        person.email ?? "",
        person.clubMember?.vlyNumber ?? "",
        person.user?.role ?? "",
        person.currentMembership?.plan.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [people, search, squadFilter, roleFilter, statusFilter]);

  const refresh = () => router.refresh();

  const patchClubMember = async (
    personId: string,
    clubMemberId: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) => {
    setBusyKey(`${personId}:roster`);
    setError(null);
    setMessage(null);
    const result = await apiPatch<{ clubMember: AdminPersonRow["clubMember"] }>(
      `/api/admin/club-members/${clubMemberId}`,
      body,
      "Could not update roster entry",
    );
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(successMessage);
    refresh();
  };

  const createClubMember = async (event: FormEvent) => {
    event.preventDefault();
    setBusyKey("create");
    setError(null);
    setMessage(null);
    const result = await apiPost(
      "/api/admin/club-members",
      {
        name: createForm.name.trim(),
        vlyNumber: createForm.vlyNumber.trim() || null,
        rosterRole: createForm.rosterRole,
        trainingTeamKey:
          createForm.rosterRole === "PLAYER"
            ? createForm.trainingTeamKey || null
            : null,
        trainingTeamKeys:
          createForm.rosterRole === "COACH" && createForm.trainingTeamKey
            ? [createForm.trainingTeamKey]
            : undefined,
        playerPaymentType:
          createForm.rosterRole === "PLAYER"
            ? createForm.playerPaymentType
            : undefined,
        coachPaymentType:
          createForm.rosterRole === "COACH" ? "PAID" : undefined,
      },
      "Could not add roster entry",
    );
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCreateForm({
      name: "",
      vlyNumber: "",
      rosterRole: "PLAYER",
      trainingTeamKey: "",
      playerPaymentType: "MEMBERSHIP",
    });
    setCreateOpen(false);
    setMessage("Roster entry added.");
    refresh();
  };

  const updateUserRole = async (personId: string, userId: string, role: string) => {
    setBusyKey(`${personId}:account`);
    setError(null);
    const result = await apiPut(
      `/api/admin/users/${userId}`,
      { role },
      "Could not update role",
    );
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPeople((current) =>
      current.map((person) =>
        person.id === personId && person.user
          ? { ...person, user: { ...person.user, role } }
          : person,
      ),
    );
    setMessage("Account role updated.");
  };

  const deleteUser = async (personId: string, userId: string) => {
    if (!confirm("Delete this account and related data?")) return;
    setBusyKey(`${personId}:account`);
    setError(null);
    const result = await apiDelete(`/api/admin/users/${userId}`);
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPeople((current) => current.filter((person) => person.id !== personId));
    setExpandedId(null);
    setMessage("Account deleted.");
    refresh();
  };

  const deleteClubMember = async (personId: string, clubMemberId: string) => {
    if (!confirm("Remove this roster entry?")) return;
    setBusyKey(`${personId}:roster`);
    setError(null);
    const result = await apiDelete(`/api/admin/club-members/${clubMemberId}`);
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPeople((current) => current.filter((person) => person.id !== personId));
    setExpandedId(null);
    setMessage("Roster entry removed.");
    refresh();
  };

  const grantMembership = async (userId: string, planId: string, status: string) => {
    setBusyKey(`grant:${userId}`);
    setError(null);
    const result = await apiPost(
      "/api/admin/memberships",
      { userId, planId, status },
      "Could not grant membership",
    );
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Membership granted.");
    refresh();
  };

  const updateMembership = async (
    membershipId: string,
    body: Record<string, unknown>,
  ) => {
    setBusyKey(`membership:${membershipId}`);
    setError(null);
    const result = await apiPut(
      `/api/admin/memberships/${membershipId}`,
      body,
      "Could not update membership",
    );
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Membership updated.");
    refresh();
  };

  const deleteMembership = async (membershipId: string) => {
    if (!confirm("Delete this membership?")) return;
    setBusyKey(`membership:${membershipId}`);
    setError(null);
    const result = await apiDelete(`/api/admin/memberships/${membershipId}`);
    setBusyKey(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Membership deleted.");
    refresh();
  };

  return (
    <AdminSection
      title="Members"
      description="Roster, accounts, and subscriptions in one place."
    >
      <SuccessBanner message={message} />
      <FormError message={error} />

      <AdminBulkCsvImport
        type="roster"
        openTriggerLabel="Bulk Excel roster"
        title="Bulk roster override"
      />

      <details
        className="group mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
        open={createOpen}
        onToggle={(event) => setCreateOpen(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-jackals-gold" />
            <span className="text-sm font-medium text-white">Add to roster</span>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
        </summary>
        <form
          onSubmit={(event) => void createClubMember(event)}
          className="space-y-4 border-t border-white/10 px-4 py-4 sm:px-5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((current) => ({ ...current, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="add-vly">VLY / VLYC</Label>
              <Input
                id="add-vly"
                value={createForm.vlyNumber}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    vlyNumber: e.target.value,
                  }))
                }
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="add-role">Roster role</Label>
              <Select
                id="add-role"
                value={createForm.rosterRole}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    rosterRole: e.target.value as "PLAYER" | "COACH",
                  }))
                }
              >
                <option value="PLAYER">Player</option>
                <option value="COACH">Coach</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="add-squad">Squad</Label>
              <Select
                id="add-squad"
                value={createForm.trainingTeamKey}
                onChange={(e) =>
                  setCreateForm((current) => ({
                    ...current,
                    trainingTeamKey: e.target.value,
                  }))
                }
              >
                <option value="">Unassigned</option>
                {trainingTeams.map((team) => (
                  <option key={team.key} value={team.key}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
            {createForm.rosterRole === "PLAYER" ? (
              <div>
                <Label htmlFor="add-pay">Payment type</Label>
                <Select
                  id="add-pay"
                  value={createForm.playerPaymentType}
                  onChange={(e) =>
                    setCreateForm((current) => ({
                      ...current,
                      playerPaymentType: e.target.value as PlayerPaymentType,
                    }))
                  }
                >
                  <option value="MEMBERSHIP">Membership</option>
                  <option value="PAYG">Pay Per Training</option>
                </Select>
              </div>
            ) : null}
          </div>
          <Button type="submit" disabled={busyKey === "create"}>
            {busyKey === "create" ? "Adding…" : "Add roster entry"}
          </Button>
        </form>
      </details>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, VLY…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {ADMIN_MEMBERS_SQUAD_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSquadFilter(item.id)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium uppercase tracking-wide transition",
                    squadFilter === item.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "PLAYER", label: "Players" },
                  { id: "COACH", label: "Coaches" },
                  { id: "ACCOUNT", label: "Accounts" },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRoleFilter(item.id)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition",
                    roleFilter === item.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="min-w-[8.5rem]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active roster</option>
              <option value="INACTIVE">Inactive</option>
              <option value="AWAITING">Awaiting signup</option>
              <option value="PAYG">Pay Per Training</option>
              <option value="OVERDUE">Overdue</option>
            </Select>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          {filtered.length} shown
          {filtered.length !== people.length ? ` of ${people.length}` : ""}
        </p>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-500">
            No people match these filters.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((person) => {
              const expanded = expandedId === person.id;
              const squads =
                person.clubMember?.trainingTeamKeys
                  .map((key) => squadShortLabel(key))
                  .filter(Boolean) ?? [];
              const overdue = isMembershipOverdue(person.currentMembership);

              return (
                <div
                  key={person.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-black/20"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedId(expanded ? null : person.id);
                      if (!expanded) setFocusSection(initialFocus);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-medium text-white">{person.name}</p>
                        {person.user?.role === "ADMIN" ? (
                          <Badge className="border-jackals-gold/30 bg-jackals-gold/10 text-jackals-gold">
                            Admin
                          </Badge>
                        ) : null}
                        {person.kind === "account_only" ? (
                          <Badge className="border-white/10 bg-white/[0.06] text-zinc-300">
                            Account only
                          </Badge>
                        ) : null}
                        {person.clubMember && !person.clubMember.userId ? (
                          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-300">
                            Awaiting signup
                          </Badge>
                        ) : null}
                        {overdue ||
                        person.currentMembership?.status === "ARREARS" ? (
                          <Badge className="border-red-500/30 bg-red-500/10 text-red-300">
                            Arrears
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {[
                          person.email ?? "No account yet",
                          person.clubMember?.vlyNumber,
                          squads.length > 0 ? squads.join(" · ") : null,
                          person.clubMember?.rosterRole === "PLAYER"
                            ? PLAYER_PAYMENT_TYPE_LABELS[
                                person.clubMember.playerPaymentType
                              ]
                            : null,
                          person.clubMember?.rosterRole === "COACH" &&
                          person.clubMember.coachPaymentType
                            ? COACH_PAYMENT_TYPE_LABELS[
                                person.clubMember.coachPaymentType
                              ]
                            : null,
                          person.currentMembership
                            ? `${person.currentMembership.plan.name} · ${formatMembershipStatusLabel(person.currentMembership.status)}`
                            : "No membership",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-zinc-500 transition",
                        expanded && "rotate-180",
                      )}
                    />
                  </button>

                  {expanded ? (
                    <PersonDetail
                      person={person}
                      plans={plans}
                      trainingTeams={trainingTeams}
                      focus={focusSection}
                      onFocusChange={setFocusSection}
                      busyKey={busyKey}
                      onRefresh={refresh}
                      onPatchClubMember={patchClubMember}
                      onDeleteClubMember={deleteClubMember}
                      onUpdateUserRole={updateUserRole}
                      onDeleteUser={deleteUser}
                      onGrantMembership={grantMembership}
                      onUpdateMembership={updateMembership}
                      onDeleteMembership={deleteMembership}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminSection>
  );
}

function PersonDetail({
  person,
  plans,
  trainingTeams,
  focus,
  onFocusChange,
  busyKey,
  onRefresh,
  onPatchClubMember,
  onDeleteClubMember,
  onUpdateUserRole,
  onDeleteUser,
  onGrantMembership,
  onUpdateMembership,
  onDeleteMembership,
}: {
  person: AdminPersonRow;
  plans: AdminMembersPlan[];
  trainingTeams: AdminMembersTrainingTeam[];
  focus: AdminMembersFocus;
  onFocusChange: (focus: AdminMembersFocus) => void;
  busyKey: string | null;
  onRefresh: () => void;
  onPatchClubMember: (
    personId: string,
    clubMemberId: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) => Promise<void>;
  onDeleteClubMember: (personId: string, clubMemberId: string) => Promise<void>;
  onUpdateUserRole: (
    personId: string,
    userId: string,
    role: string,
  ) => Promise<void>;
  onDeleteUser: (personId: string, userId: string) => Promise<void>;
  onGrantMembership: (
    userId: string,
    planId: string,
    status: string,
  ) => Promise<void>;
  onUpdateMembership: (
    membershipId: string,
    body: Record<string, unknown>,
  ) => Promise<void>;
  onDeleteMembership: (membershipId: string) => Promise<void>;
}) {
  const member = person.clubMember;
  const user = person.user;
  const membership = person.currentMembership;

  const [vlyDraft, setVlyDraft] = useState(member?.vlyNumber ?? "");
  const [grantPlanId, setGrantPlanId] = useState(plans[0]?.id ?? "");
  const [grantStatus, setGrantStatus] = useState<AdminMembershipStatus>("ACTIVE");
  const [editForm, setEditForm] = useState(() =>
    membership
      ? {
          planId: membership.plan.id,
          status: membership.status,
          endDate: format(new Date(membership.endDate), "yyyy-MM-dd"),
          paymentOverdueOverride: membership.paymentOverdueOverride,
          paymentOverdueOverrideNote: membership.paymentOverdueOverrideNote ?? "",
          paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil
            ? format(new Date(membership.paymentOverdueOverrideUntil), "yyyy-MM-dd")
            : "",
        }
      : null,
  );

  const sections: { id: AdminMembersFocus; label: string }[] = [
    { id: "account", label: "Account" },
    { id: "roster", label: "Roster" },
    { id: "subscription", label: "Subscription" },
  ];

  const rosterBusy = busyKey === `${person.id}:roster`;
  const accountBusy = busyKey === `${person.id}:account`;
  const showArrearsOverride =
    editForm?.status === "ARREARS" ||
    membership?.status === "ARREARS" ||
    Boolean(editForm?.paymentOverdueOverride);

  return (
    <div className="border-t border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent px-4 py-5 sm:px-5">
      <div className="mb-5 flex gap-1 border-b border-white/10">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onFocusChange(section.id)}
            className={cn(
              "-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition",
              focus === section.id
                ? "border-jackals-red text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      {focus === "roster" ? (
        member ? (
          <div className="space-y-6">
            <DetailBlock title="Status">
              <label className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-2.5">
                <span className="text-sm text-zinc-200">Active on roster</span>
                <Checkbox
                  checked={member.active}
                  disabled={rosterBusy}
                  onChange={() =>
                    void onPatchClubMember(
                      person.id,
                      member.id,
                      { active: !member.active },
                      member.active ? "Marked inactive" : "Marked active",
                    )
                  }
                />
              </label>
            </DetailBlock>

            {member.rosterRole === "PLAYER" ? (
              <DetailBlock title="Squad & payment">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Squad</Label>
                    <Select
                      value={member.trainingTeamKey ?? ""}
                      disabled={rosterBusy}
                      onChange={(e) =>
                        void onPatchClubMember(
                          person.id,
                          member.id,
                          { trainingTeamKey: e.target.value || null },
                          "Squad updated",
                        )
                      }
                    >
                      <option value="">Unassigned</option>
                      {trainingTeams.map((team) => (
                        <option key={team.key} value={team.key}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Payment type</Label>
                    <Select
                      value={member.playerPaymentType}
                      disabled={rosterBusy}
                      onChange={(e) =>
                        void onPatchClubMember(
                          person.id,
                          member.id,
                          { playerPaymentType: e.target.value },
                          "Payment type updated",
                        )
                      }
                    >
                      <option value="MEMBERSHIP">Membership</option>
                      <option value="PAYG">Pay Per Training</option>
                    </Select>
                  </div>
                </div>
              </DetailBlock>
            ) : (
              <DetailBlock
                title="Coach squads"
                description="Tick squads they cover, then set Head or Cover."
              >
                <div className="overflow-hidden rounded-lg border border-white/10">
                  {trainingTeams.map((team, index) => {
                    const checked = member.trainingTeamKeys.includes(team.key);
                    const priority =
                      member.coachSquadPriorities[team.key] ?? COVER_COACH_PRIORITY;
                    return (
                      <div
                        key={team.key}
                        className={cn(
                          "flex flex-wrap items-center gap-3 px-3 py-2.5",
                          index > 0 && "border-t border-white/10",
                        )}
                      >
                        <label className="flex min-w-0 flex-1 items-center gap-2.5 text-sm text-zinc-200">
                          <Checkbox
                            checked={checked}
                            disabled={rosterBusy}
                            onChange={() => {
                              const trainingTeamKeys = checked
                                ? member.trainingTeamKeys.filter(
                                    (key) => key !== team.key,
                                  )
                                : [...member.trainingTeamKeys, team.key];
                              const coachSquadPriorities = {
                                ...member.coachSquadPriorities,
                              };
                              if (checked) {
                                delete coachSquadPriorities[team.key];
                              } else {
                                coachSquadPriorities[team.key] = COVER_COACH_PRIORITY;
                              }
                              void onPatchClubMember(
                                person.id,
                                member.id,
                                { trainingTeamKeys, coachSquadPriorities },
                                "Coach squads updated",
                              );
                            }}
                          />
                          <span className="truncate">{team.name}</span>
                        </label>
                        {checked ? (
                          <div className="flex overflow-hidden rounded-md border border-white/10">
                            {(
                              [
                                { value: HEAD_COACH_PRIORITY, label: "Head" },
                                { value: COVER_COACH_PRIORITY, label: "Cover" },
                              ] as const
                            ).map((option) => (
                              <button
                                key={option.label}
                                type="button"
                                disabled={rosterBusy}
                                className={cn(
                                  "px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition",
                                  priority === option.value
                                    ? "bg-jackals-red/25 text-jackals-red-light"
                                    : "bg-transparent text-zinc-500 hover:text-zinc-300",
                                )}
                                onClick={() =>
                                  void onPatchClubMember(
                                    person.id,
                                    member.id,
                                    {
                                      trainingTeamKeys: member.trainingTeamKeys,
                                      coachSquadPriorities: {
                                        ...member.coachSquadPriorities,
                                        [team.key]: option.value,
                                      },
                                    },
                                    "Coach priority updated",
                                  )
                                }
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 max-w-xs">
                  <Label>Coach payment</Label>
                  <Select
                    value={member.coachPaymentType ?? "PAID"}
                    disabled={rosterBusy}
                    onChange={(e) =>
                      void onPatchClubMember(
                        person.id,
                        member.id,
                        {
                          coachPaymentType: e.target.value as CoachPaymentType,
                        },
                        "Coach payment type updated",
                      )
                    }
                  >
                    <option value="PAID">Paid coach</option>
                    <option value="VOLUNTEER">Volunteer coach</option>
                  </Select>
                </div>
              </DetailBlock>
            )}

            <DetailBlock title="Identity">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <Label htmlFor={`vly-${member.id}`}>VLY / VLYC</Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id={`vly-${member.id}`}
                      value={vlyDraft}
                      onChange={(e) => setVlyDraft(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={rosterBusy}
                      onClick={() =>
                        void onPatchClubMember(
                          person.id,
                          member.id,
                          { vlyNumber: vlyDraft.trim() || null },
                          "VLY number updated",
                        )
                      }
                    >
                      Save
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <Label>Profile</Label>
                    <div className="mt-2">
                      <AdminMemberProfileImage
                        memberId={member.id}
                        name={member.name}
                        imageUrl={member.profileImageUrl}
                        disabled={rosterBusy}
                        onUpdated={onRefresh}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>VLY photo</Label>
                    <div className="mt-2">
                      <AdminMemberVlyPhoto
                        memberId={member.id}
                        name={member.name}
                        imageUrl={member.vlyMembershipPhotoUrl}
                        disabled={rosterBusy}
                        onUpdated={onRefresh}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </DetailBlock>

            {!member.userId ? (
              <div className="border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1 text-rose-300"
                  disabled={rosterBusy}
                  onClick={() => void onDeleteClubMember(person.id, member.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove roster entry
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            Account only — add them via “Add to roster” if they should appear on the
            club roster.
          </p>
        )
      ) : null}

      {focus === "account" ? (
        <div className="space-y-6">
          <DetailBlock title="Profile">
            {user ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-zinc-500">Email</dt>
                  <dd className="mt-1 text-sm text-white">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Joined</dt>
                  <dd className="mt-1 text-sm text-white">
                    {format(new Date(user.createdAt), "d MMM yyyy")}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">
                Awaiting registration — no login account yet.
              </p>
            )}
          </DetailBlock>

          <DetailBlock title="Role & permissions">
            <div className="grid gap-3 sm:grid-cols-2">
              {member ? (
                <div>
                  <Label>Role</Label>
                  <Select
                    value={member.rosterRole}
                    disabled={rosterBusy}
                    onChange={(e) =>
                      void onPatchClubMember(
                        person.id,
                        member.id,
                        { rosterRole: e.target.value },
                        "Role updated",
                      )
                    }
                  >
                    <option value="PLAYER">Player</option>
                    <option value="COACH">Coach</option>
                  </Select>
                </div>
              ) : (
                <p className="text-sm text-zinc-500 sm:col-span-2">
                  Not on roster — add a roster entry to set Player or Coach.
                </p>
              )}
              {user ? (
                <div>
                  <Label>Admin permission</Label>
                  <Select
                    value={user.role === "ADMIN" ? "YES" : "NO"}
                    disabled={accountBusy}
                    onChange={(e) =>
                      void onUpdateUserRole(
                        person.id,
                        user.id,
                        e.target.value === "YES" ? "ADMIN" : "MEMBER",
                      )
                    }
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </Select>
                </div>
              ) : null}
            </div>
          </DetailBlock>

          {user ? (
            <div className="border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                className="gap-1 text-rose-300"
                disabled={accountBusy}
                onClick={() => void onDeleteUser(person.id, user.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete account
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {focus === "subscription" ? (
        <div className="space-y-6">
          {membership && editForm ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void onUpdateMembership(membership.id, {
                  status: editForm.status,
                  endDate: new Date(editForm.endDate).toISOString(),
                  planId: editForm.planId,
                  paymentOverdueOverride: editForm.paymentOverdueOverride,
                  paymentOverdueOverrideNote:
                    editForm.paymentOverdueOverrideNote.trim() || null,
                  paymentOverdueOverrideUntil: editForm.paymentOverdueOverride
                    ? editForm.paymentOverdueOverrideUntil
                      ? new Date(editForm.paymentOverdueOverrideUntil).toISOString()
                      : null
                    : null,
                });
              }}
            >
              <DetailBlock title="Membership">
                <p className="mb-3 text-sm text-zinc-400">
                  {scheduleLabel(membership.paymentSchedule)} ·{" "}
                  {formatMembershipStatusLabel(membership.status)}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Plan</Label>
                    <Select
                      value={editForm.planId}
                      onChange={(e) =>
                        setEditForm((current) =>
                          current
                            ? { ...current, planId: e.target.value }
                            : current,
                        )
                      }
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({formatPrice(plan.price, "EUR")})
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((current) =>
                          current
                            ? { ...current, status: e.target.value }
                            : current,
                        )
                      }
                    >
                      {membershipStatusOptions(membership.status).map((status) => (
                        <option key={status} value={status}>
                          {formatMembershipStatusLabel(status)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) =>
                        setEditForm((current) =>
                          current
                            ? { ...current, endDate: e.target.value }
                            : current,
                        )
                      }
                    />
                  </div>
                </div>
              </DetailBlock>

              {showArrearsOverride ? (
                <DetailBlock title="Arrears override">
                  <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.07] px-3 py-3 space-y-3">
                    <p className="text-sm text-amber-100/90">
                      Training and match responses stay blocked unless you allow
                      access below.
                    </p>
                    <label className="flex items-start gap-2.5 text-sm text-zinc-200">
                      <Checkbox
                        className="mt-0.5"
                        checked={editForm.paymentOverdueOverride}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditForm((current) =>
                            current
                              ? {
                                  ...current,
                                  paymentOverdueOverride: checked,
                                  paymentOverdueOverrideUntil:
                                    checked && !current.paymentOverdueOverrideUntil
                                      ? format(addDays(new Date(), 14), "yyyy-MM-dd")
                                      : current.paymentOverdueOverrideUntil,
                                }
                              : current,
                          );
                        }}
                      />
                      <span>Allow training &amp; match access despite arrears</span>
                    </label>
                    {editForm.paymentOverdueOverride ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Override until</Label>
                          <Input
                            type="date"
                            value={editForm.paymentOverdueOverrideUntil}
                            onChange={(e) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      paymentOverdueOverrideUntil: e.target.value,
                                    }
                                  : current,
                              )
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label>Note</Label>
                          <Input
                            value={editForm.paymentOverdueOverrideNote}
                            onChange={(e) =>
                              setEditForm((current) =>
                                current
                                  ? {
                                      ...current,
                                      paymentOverdueOverrideNote: e.target.value,
                                    }
                                  : current,
                              )
                            }
                            placeholder="Optional reason"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </DetailBlock>
              ) : null}

              <DetailBlock title="Instalments">
                {membership.payments.length === 0 ? (
                  <p className="text-sm text-zinc-500">No instalments on this plan.</p>
                ) : (
                  <ul className="overflow-hidden rounded-lg border border-white/10 divide-y divide-white/10">
                    {membership.payments.map((payment, index) => (
                      <li
                        key={`${payment.installmentNumber ?? index}-${payment.dueDate}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <span className="text-zinc-300">
                          Instalment {payment.installmentNumber ?? index + 1}
                          {payment.dueDate
                            ? ` · ${format(new Date(payment.dueDate), "d MMM yyyy")}`
                            : ""}
                        </span>
                        <span className="shrink-0 text-zinc-500">
                          {formatPrice(payment.amount, "EUR")} · {payment.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </DetailBlock>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <Button
                  type="submit"
                  disabled={busyKey === `membership:${membership.id}`}
                >
                  {busyKey === `membership:${membership.id}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save membership
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-rose-300"
                  disabled={busyKey === `membership:${membership.id}`}
                  onClick={() => void onDeleteMembership(membership.id)}
                >
                  Delete membership
                </Button>
              </div>
            </form>
          ) : user ? (
            <DetailBlock
              title="Grant membership"
              description="No membership on this account yet."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Plan</Label>
                  <Select
                    value={grantPlanId}
                    onChange={(e) => setGrantPlanId(e.target.value)}
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({formatPrice(plan.price, "EUR")})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={grantStatus}
                    onChange={(e) =>
                      setGrantStatus(e.target.value as AdminMembershipStatus)
                    }
                  >
                    {ADMIN_MEMBERSHIP_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatMembershipStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                className="mt-4"
                disabled={!grantPlanId || busyKey === `grant:${user.id}`}
                onClick={() =>
                  void onGrantMembership(user.id, grantPlanId, grantStatus)
                }
              >
                {busyKey === `grant:${user.id}` ? "Granting…" : "Grant membership"}
              </Button>
            </DetailBlock>
          ) : (
            <p className="text-sm text-zinc-500">
              Memberships need a linked account. Wait for registration first.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function DetailBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {title}
        </h3>
        {description ? (
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
