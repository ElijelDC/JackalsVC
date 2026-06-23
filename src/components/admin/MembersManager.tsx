"use client";

import { useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";
import {
  ADMIN_MEMBERSHIP_STATUSES,
  formatMembershipStatusLabel,
  formatMembershipSubscriptionOrCoachLabel,
  isCoachMembershipStatus,
  membershipStatusBadgeClass,
} from "@/lib/membership-status";
import {
  assessMembershipPaymentAccess,
  isInstallmentSchedule,
  isPaymentOverdueOverrideActive,
  matchesMembershipSubscriptionFilter,
  PAYMENT_OVERDUE_GRACE_DAYS,
  type MembershipSubscriptionFilter,
} from "@/lib/membership-overdue";
import { cn, formatPrice } from "@/lib/utils";

type Plan = { id: string; name: string; price: number };
type UserOption = { id: string; name: string; email: string };

type MembershipPayment = {
  status: string;
  dueDate: string | null;
  amount: number;
  installmentNumber: number | null;
};

type Membership = {
  id: string;
  status: string;
  paymentSchedule: string;
  paymentOverdueOverride: boolean;
  paymentOverdueOverrideNote: string | null;
  paymentOverdueOverrideUntil: string | null;
  paymentDeferralExcuse: string | null;
  paymentDeferralDueDate: string | null;
  paymentDeferralRequestedAt: string | null;
  startDate: string;
  endDate: string;
  user: UserOption;
  plan: Plan;
  payments: MembershipPayment[];
};

const SUBSCRIPTION_FILTERS: {
  key: MembershipSubscriptionFilter;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "coach", label: "Coach" },
  { key: "expired", label: "Expired" },
  { key: "overridden", label: "Overridden" },
  { key: "overdue", label: "Overdue" },
  { key: "cancelled", label: "Cancelled" },
];

function getMembershipPaymentAccess(membership: Membership) {
  return assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: membership.paymentOverdueOverride,
    paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
    payments: membership.payments ?? [],
  });
}

function isOverrideActive(membership: Membership) {
  return isPaymentOverdueOverrideActive({
    paymentOverdueOverride: membership.paymentOverdueOverride,
    paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil,
  });
}

type StatusBadge = {
  label: string;
  className: string;
};

function getMembershipStatusBadges(membership: Membership): StatusBadge[] {
  const badges: StatusBadge[] = [];

  if (isCoachMembershipStatus(membership.status)) {
    badges.push({
      label: "Coach",
      className: membershipStatusBadgeClass("COACH"),
    });
    return badges;
  }

  if (membership.status === "ACTIVE") {
    badges.push({
      label: "Active",
      className: membershipStatusBadgeClass("ACTIVE"),
    });
  } else if (membership.status === "EXPIRED") {
    badges.push({
      label: "Expired",
      className: membershipStatusBadgeClass("EXPIRED"),
    });
  } else if (membership.status === "CANCELLED") {
    badges.push({
      label: "Cancelled",
      className: membershipStatusBadgeClass("CANCELLED"),
    });
  } else if (membership.status === "PENDING_PAYMENT") {
    badges.push({
      label: "Awaiting payment",
      className: membershipStatusBadgeClass("PENDING_PAYMENT"),
    });
  }

  if (
    membership.status === "ACTIVE" &&
    isInstallmentSchedule(membership.paymentSchedule)
  ) {
    const access = getMembershipPaymentAccess(membership);

    if (isOverrideActive(membership)) {
      badges.push({
        label: membership.paymentOverdueOverrideUntil
          ? `Override until ${format(new Date(membership.paymentOverdueOverrideUntil), "d MMM")}`
          : "Override active",
        className: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      });
    } else if (membership.paymentOverdueOverride) {
      badges.push({
        label: "Override expired",
        className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
      });
    } else if (access.isOverdue) {
      badges.push({
        label: "Payment overdue",
        className: "border-red-500/30 bg-red-500/10 text-red-300",
      });
    } else if (access.isPastDue) {
      badges.push({
        label: `Past due · ${access.graceDaysRemaining ?? 0}d grace`,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      });
    }

    if (
      membership.paymentDeferralDueDate &&
      membership.paymentDeferralExcuse &&
      !isOverrideActive(membership)
    ) {
      badges.push({
        label: `Pay-by requested ${format(new Date(membership.paymentDeferralDueDate), "d MMM")}`,
        className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      });
    }
  }

  return badges;
}

function getMembershipAccentClass(membership: Membership) {
  if (membership.status === "COACH") {
    return "border-l-blue-500/70";
  }

  if (membership.status === "EXPIRED") {
    return "border-l-amber-500/80";
  }

  if (membership.status === "CANCELLED") {
    return "border-l-zinc-600";
  }

  if (
    membership.status === "ACTIVE" &&
    isInstallmentSchedule(membership.paymentSchedule)
  ) {
    const access = getMembershipPaymentAccess(membership);

    if (
      !isOverrideActive(membership) &&
      (access.isOverdue || access.isPastDue)
    ) {
      return access.isOverdue
        ? "border-l-red-500/80"
        : "border-l-amber-500/80";
    }
  }

  if (membership.status === "ACTIVE") {
    return "border-l-green-500/70";
  }

  return "border-l-white/10";
}

const STATUSES = ADMIN_MEMBERSHIP_STATUSES;

const emptyEditForm = {
  planId: "",
  status: "ACTIVE" as (typeof STATUSES)[number],
  endDate: "",
  paymentOverdueOverride: false,
  paymentOverdueOverrideNote: "",
  paymentOverdueOverrideUntil: "",
};

export function MembersManager({
  initialMemberships,
  plans,
}: {
  initialMemberships: Membership[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [memberships, setMemberships] = useSyncedListState(initialMemberships);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEditForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MembershipSubscriptionFilter>("all");

  const filteredMemberships = useMemo(
    () =>
      memberships.filter((membership) => {
        const subscriptionLabel = formatMembershipSubscriptionOrCoachLabel(
          membership.plan.name,
          membership.paymentSchedule,
          membership.status,
        );

        const matchesSearch = matchesAdminSearch(
          search,
          membership.user.name,
          membership.user.email,
          membership.plan.name,
          subscriptionLabel,
          membership.status,
          membership.paymentDeferralExcuse ?? "",
        );

        return (
          matchesSearch &&
          matchesMembershipSubscriptionFilter(membership, statusFilter)
        );
      }),
    [memberships, search, statusFilter],
  );

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== "all";

  const editingMembership = editingId
    ? memberships.find((membership) => membership.id === editingId)
    : null;

  const editingPaymentAccess = editingMembership
    ? assessMembershipPaymentAccess({
        membershipStatus: editingMembership.status,
        paymentSchedule: editingMembership.paymentSchedule,
        paymentOverdueOverride: form.paymentOverdueOverride,
        paymentOverdueOverrideUntil: form.paymentOverdueOverrideUntil || null,
        payments: editingMembership.payments ?? [],
      })
    : null;

  const underlyingPaymentAccess = editingMembership
    ? assessMembershipPaymentAccess({
        membershipStatus: editingMembership.status,
        paymentSchedule: editingMembership.paymentSchedule,
        paymentOverdueOverride: false,
        paymentOverdueOverrideUntil: null,
        payments: editingMembership.payments ?? [],
      })
    : null;

  const resetForm = () => {
    setForm(emptyEditForm);
    setEditingId(null);
    setError(null);
  };

  const loadMemberships = useCallback(async () => {
    const result = await apiGet<{ memberships: Membership[] }>(
      "/api/admin/memberships",
    );
    if (result.ok) setMemberships(result.data.memberships);
  }, [setMemberships]);

  const startEdit = (membership: Membership) => {
    beginAdminEdit(() => {
      setEditingId(membership.id);
      setForm({
        planId: membership.plan.id,
        status: membership.status as (typeof STATUSES)[number],
        endDate: format(new Date(membership.endDate), "yyyy-MM-dd"),
        paymentOverdueOverride: isOverrideActive(membership),
        paymentOverdueOverrideNote: membership.paymentOverdueOverrideNote ?? "",
        paymentOverdueOverrideUntil: membership.paymentOverdueOverrideUntil
          ? format(new Date(membership.paymentOverdueOverrideUntil), "yyyy-MM-dd")
          : membership.paymentDeferralDueDate
            ? format(new Date(membership.paymentDeferralDueDate), "yyyy-MM-dd")
            : "",
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/admin/memberships/${editingId}`, {
      status: form.status,
      endDate: new Date(form.endDate).toISOString(),
      planId: form.planId,
      paymentOverdueOverride: form.paymentOverdueOverride,
      paymentOverdueOverrideNote: form.paymentOverdueOverrideNote.trim() || null,
      paymentOverdueOverrideUntil: form.paymentOverdueOverride
        ? form.paymentOverdueOverrideUntil
          ? new Date(form.paymentOverdueOverrideUntil).toISOString()
          : null
        : null,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Membership updated.");
    resetForm();
    await loadMemberships();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this membership?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/memberships/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    await loadMemberships();
    router.refresh();
  };

  return (
    <AdminSection
      title="Member subscriptions"
      description="View active memberships and update expiry dates, statuses, or overdue overrides."
    >
      {editingId && editingMembership && (
        <AdminFormCard
          title="Edit membership"
          error={error}
          message={message}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          submitLabel={loading ? "Saving..." : "Save changes"}
          loading={loading}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Member</Label>
              <p className="mt-1 text-sm font-medium text-white">
                {editingMembership.user.name} · {editingMembership.user.email}
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Subscription</Label>
              <p className="mt-1 text-sm font-medium text-white">
                {formatMembershipSubscriptionOrCoachLabel(
                  editingMembership.plan.name,
                  editingMembership.paymentSchedule,
                  editingMembership.status,
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Payment schedule is set at checkout and cannot be changed here.
              </p>
            </div>
            <div>
              <Label htmlFor="member-plan-edit">Plan</Label>
              <Select
                id="member-plan-edit"
                value={form.planId}
                onChange={(event) =>
                  setForm({ ...form, planId: event.target.value })
                }
                required
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="member-end">Expiry date</Label>
              <Input
                id="member-end"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm({ ...form, endDate: event.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="member-status">Membership status</Label>
              <Select
                id="member-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status: event.target.value as (typeof STATUSES)[number],
                  })
                }
                required
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatMembershipStatusLabel(status)}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-zinc-500">
                Membership lifecycle only. Payment overdue is tracked separately below for
                monthly and instalment plans.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Payment status</Label>
              {!isInstallmentSchedule(editingMembership.paymentSchedule) ? (
                <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
                  Not applicable — this member is on a{" "}
                  <span className="text-white">Full payment</span> plan. Instalment overdue
                  tracking only applies to Monthly and Instalment subscriptions.
                </p>
              ) : form.paymentOverdueOverride ? (
                <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                  <p className="text-sm font-medium text-blue-300">
                    Overridden by admin
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Training and match access is allowed despite overdue instalment rules.
                    {form.paymentOverdueOverrideUntil && (
                      <>
                        {" "}
                        Override runs until{" "}
                        {format(new Date(form.paymentOverdueOverrideUntil), "d MMM yyyy")}.
                      </>
                    )}
                    {underlyingPaymentAccess?.isOverdue &&
                      underlyingPaymentAccess.overduePayment && (
                        <>
                          {" "}
                          Instalment{" "}
                          {underlyingPaymentAccess.overduePayment.installmentNumber ?? "—"} ·{" "}
                          {formatPrice(underlyingPaymentAccess.overduePayment.amount)} was due{" "}
                          {format(
                            underlyingPaymentAccess.overduePayment.dueDate,
                            "d MMM yyyy",
                          )}{" "}
                          ({underlyingPaymentAccess.daysPastDue} days ago).
                        </>
                      )}
                    {underlyingPaymentAccess?.isPastDue &&
                      !underlyingPaymentAccess.isOverdue && (
                        <>
                          {" "}
                          An instalment is in the {PAYMENT_OVERDUE_GRACE_DAYS}-day grace period.
                        </>
                      )}
                  </p>
                </div>
              ) : editingPaymentAccess?.isOverdue ? (
                <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-300">Payment overdue</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {editingPaymentAccess.overduePayment && (
                      <>
                        Instalment {editingPaymentAccess.overduePayment.installmentNumber ?? "—"}{" "}
                        · {formatPrice(editingPaymentAccess.overduePayment.amount)} was due{" "}
                        {format(
                          editingPaymentAccess.overduePayment.dueDate,
                          "d MMM yyyy",
                        )}{" "}
                        ({editingPaymentAccess.daysPastDue} days ago). Training and match access
                        is blocked after the {PAYMENT_OVERDUE_GRACE_DAYS}-day grace period.
                      </>
                    )}
                  </p>
                </div>
              ) : editingPaymentAccess?.isPastDue ? (
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-sm font-medium text-amber-300">Past due (in grace period)</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {editingPaymentAccess.graceDaysRemaining ?? 0} day
                    {(editingPaymentAccess.graceDaysRemaining ?? 0) === 1 ? "" : "s"} left before
                    access is blocked.
                  </p>
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-sm font-medium text-green-300">Payments up to date</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    No overdue instalments for this subscription.
                  </p>
                </div>
              )}
            </div>
            {isInstallmentSchedule(editingMembership.paymentSchedule) && (
              <div className="space-y-4 sm:col-span-2">
                {editingMembership.paymentDeferralExcuse &&
                  editingMembership.paymentDeferralDueDate && (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
                      <p className="text-sm font-medium text-amber-200">
                        Member extension request
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Pay-by date requested:{" "}
                        <span className="font-medium text-white">
                          {format(
                            new Date(editingMembership.paymentDeferralDueDate),
                            "d MMM yyyy",
                          )}
                        </span>
                        {editingMembership.paymentDeferralRequestedAt && (
                          <span className="text-zinc-500">
                            {" "}
                            · sent{" "}
                            {format(
                              new Date(editingMembership.paymentDeferralRequestedAt),
                              "d MMM yyyy",
                            )}
                          </span>
                        )}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                        {editingMembership.paymentDeferralExcuse}
                      </p>
                    </div>
                  )}
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <Checkbox
                    checked={form.paymentOverdueOverride}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        paymentOverdueOverride: event.target.checked,
                        paymentOverdueOverrideUntil: event.target.checked
                          ? form.paymentOverdueOverrideUntil ||
                            (editingMembership.paymentDeferralDueDate
                              ? format(
                                  new Date(editingMembership.paymentDeferralDueDate),
                                  "yyyy-MM-dd",
                                )
                              : "")
                          : "",
                      })
                    }
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">
                      Overdue payment override
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-zinc-500">
                      Allow training and match access until the date below, even when an
                      instalment is overdue.
                    </span>
                  </span>
                </label>
                {form.paymentOverdueOverride && (
                  <>
                    <div>
                      <Label htmlFor="member-override-until">Override until</Label>
                      <Input
                        id="member-override-until"
                        type="date"
                        value={form.paymentOverdueOverrideUntil}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            paymentOverdueOverrideUntil: event.target.value,
                          })
                        }
                        required
                        className="mt-1"
                      />
                      <p className="mt-1 text-xs text-zinc-500">
                        Access returns to normal after this date if payment is still
                        outstanding.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="member-override-note">Admin note (optional)</Label>
                      <Textarea
                        id="member-override-note"
                        value={form.paymentOverdueOverrideNote}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            paymentOverdueOverrideNote: event.target.value,
                          })
                        }
                        rows={3}
                        placeholder="e.g. Agreed extension until payday — discussed with treasurer"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </AdminFormCard>
      )}

      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
              All subscriptions ({filteredMemberships.length}
              {hasActiveFilters ? ` of ${memberships.length}` : ""})
            </h3>
            <div className="w-full sm:max-w-xs">
              <AdminSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search name, email, subscription…"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUBSCRIPTION_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === filter.key
                    ? "border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light"
                    : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-white",
                )}
              >
                {filter.label}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
        {filteredMemberships.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {hasActiveFilters
              ? "No memberships match your filters."
              : "No memberships yet."}
          </p>
        ) : (
          filteredMemberships.map((membership) => {
            const subscriptionLabel = formatMembershipSubscriptionOrCoachLabel(
              membership.plan.name,
              membership.paymentSchedule,
              membership.status,
            );
            const statusBadges = getMembershipStatusBadges(membership);
            const accentClass = getMembershipAccentClass(membership);

            return (
              <Card
                key={membership.id}
                className={cn(
                  "flex flex-col gap-4 border-l-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                  accentClass,
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {membership.user.name}
                    </p>
                    <span className="text-sm text-zinc-500">·</span>
                    <p className="text-sm text-zinc-300">{subscriptionLabel}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-400">
                    {membership.user.email}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {statusBadges.map((badge) => (
                      <Badge
                        key={badge.label}
                        className={cn("border px-2 py-0.5", badge.className)}
                      >
                        {badge.label}
                      </Badge>
                    ))}
                    <span className="text-xs text-zinc-500">
                      Expires {format(new Date(membership.endDate), "d MMM yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(membership)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === membership.id}
                    onClick={() => handleDelete(membership.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    {deletingId === membership.id ? "..." : "Delete"}
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </AdminSection>
  );
}
