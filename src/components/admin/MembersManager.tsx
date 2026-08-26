"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, Loader2, Pencil, Trash2, X } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";
import {
  formatMembershipPlanShortName,
  formatPaymentScheduleLabel,
  type PaymentSchedule,
  PAYMENT_SCHEDULES,
} from "@/lib/membership-config";
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

function scheduleLabel(paymentSchedule: string) {
  const schedule = PAYMENT_SCHEDULES.includes(paymentSchedule as PaymentSchedule)
    ? (paymentSchedule as PaymentSchedule)
    : null;
  return schedule ? formatPaymentScheduleLabel(schedule) : paymentSchedule;
}

function getMembershipPaymentSummary(membership: Membership) {
  const payments = membership.payments ?? [];
  if (payments.length === 0) {
    return isInstallmentSchedule(membership.paymentSchedule)
      ? "No instalment records"
      : "Full payment · no instalment schedule";
  }

  const completed = payments.filter((payment) => payment.status === "COMPLETED");
  const pending = payments.filter((payment) => payment.status === "PENDING");
  const paidAmount = completed.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return `${completed.length} paid · ${pending.length} pending · ${formatPrice(paidAmount)} / ${formatPrice(totalAmount)}`;
}

function MembershipExpandDetails({ membership }: { membership: Membership }) {
  const statusBadges = getMembershipStatusBadges(membership);
  const access = getMembershipPaymentAccess(membership);
  const overrideActive = isOverrideActive(membership);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2 text-sm text-zinc-400">
        <p>
          <span className="text-zinc-500">Email:</span> {membership.user.email}
        </p>
        <p>
          <span className="text-zinc-500">Schedule:</span>{" "}
          {scheduleLabel(membership.paymentSchedule)}
        </p>
        <p>
          <span className="text-zinc-500">Starts:</span>{" "}
          {format(new Date(membership.startDate), "d MMM yyyy")}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {statusBadges.map((badge) => (
            <Badge
              key={badge.label}
              className={cn("border px-2 py-0.5", badge.className)}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3 text-sm text-zinc-400">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Payment summary
          </p>
          <p className="mt-1">{getMembershipPaymentSummary(membership)}</p>
        </div>

        {isInstallmentSchedule(membership.paymentSchedule) ? (
          <div className="space-y-2">
            {overrideActive ? (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <p className="text-sm font-medium text-blue-300">
                  Overdue override active
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {membership.paymentOverdueOverrideUntil
                    ? `Until ${format(new Date(membership.paymentOverdueOverrideUntil), "d MMM yyyy")}`
                    : "No end date set"}
                  {membership.paymentOverdueOverrideNote
                    ? ` · ${membership.paymentOverdueOverrideNote}`
                    : ""}
                </p>
              </div>
            ) : null}

            {membership.paymentDeferralExcuse &&
            membership.paymentDeferralDueDate ? (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                <p className="text-sm font-medium text-amber-200">
                  Extension request
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Pay-by{" "}
                  {format(
                    new Date(membership.paymentDeferralDueDate),
                    "d MMM yyyy",
                  )}
                  {membership.paymentDeferralRequestedAt
                    ? ` · sent ${format(new Date(membership.paymentDeferralRequestedAt), "d MMM yyyy")}`
                    : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-500">
                  {membership.paymentDeferralExcuse}
                </p>
              </div>
            ) : null}

            {!overrideActive && access.isOverdue ? (
              <p className="text-xs text-red-300">
                Overdue ·{" "}
                {access.overduePayment
                  ? `instalment ${access.overduePayment.installmentNumber ?? "—"} was due ${format(access.overduePayment.dueDate, "d MMM yyyy")}`
                  : "instalment past grace"}
              </p>
            ) : null}

            {!overrideActive && access.isPastDue && !access.isOverdue ? (
              <p className="text-xs text-amber-300">
                Past due · {access.graceDaysRemaining ?? 0}d grace remaining
              </p>
            ) : null}

            {(membership.payments ?? []).length > 0 ? (
              <ul className="space-y-1 text-xs text-zinc-500">
                {membership.payments.map((payment, index) => (
                  <li key={`${payment.installmentNumber ?? index}-${payment.dueDate}`}>
                    {payment.installmentNumber
                      ? `Instalment ${payment.installmentNumber}`
                      : `Payment ${index + 1}`}
                    {" · "}
                    {formatPrice(payment.amount)}
                    {" · "}
                    {payment.status === "COMPLETED" ? "Paid" : "Pending"}
                    {payment.dueDate
                      ? ` · due ${format(new Date(payment.dueDate), "d MMM yyyy")}`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const STATUSES = ADMIN_MEMBERSHIP_STATUSES;

type MembershipEditFormState = {
  planId: string;
  status: (typeof STATUSES)[number];
  endDate: string;
  paymentOverdueOverride: boolean;
  paymentOverdueOverrideNote: string;
  paymentOverdueOverrideUntil: string;
};

const emptyEditForm: MembershipEditFormState = {
  planId: "",
  status: "ACTIVE",
  endDate: "",
  paymentOverdueOverride: false,
  paymentOverdueOverrideNote: "",
  paymentOverdueOverrideUntil: "",
};

function MembershipEditFields({
  membership,
  form,
  setForm,
  idPrefix,
  plans,
}: {
  membership: Membership;
  form: MembershipEditFormState;
  setForm: (next: MembershipEditFormState) => void;
  idPrefix: string;
  plans: Plan[];
}) {
  const editingPaymentAccess = assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: form.paymentOverdueOverride,
    paymentOverdueOverrideUntil: form.paymentOverdueOverrideUntil || null,
    payments: membership.payments ?? [],
  });

  const underlyingPaymentAccess = assessMembershipPaymentAccess({
    membershipStatus: membership.status,
    paymentSchedule: membership.paymentSchedule,
    paymentOverdueOverride: false,
    paymentOverdueOverrideUntil: null,
    payments: membership.payments ?? [],
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label>Member</Label>
        <p className="mt-1 text-sm font-medium text-white">
          {membership.user.name} · {membership.user.email}
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label>Subscription</Label>
        <p className="mt-1 text-sm font-medium text-white">
          {formatMembershipSubscriptionOrCoachLabel(
            membership.plan.name,
            membership.paymentSchedule,
            membership.status,
          )}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Payment schedule is set at checkout and cannot be changed here.
        </p>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-plan`}>Plan</Label>
        <Select
          id={`${idPrefix}-plan`}
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
        <Label htmlFor={`${idPrefix}-end`}>Expiry date</Label>
        <Input
          id={`${idPrefix}-end`}
          type="date"
          value={form.endDate}
          onChange={(event) =>
            setForm({ ...form, endDate: event.target.value })
          }
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-status`}>Membership status</Label>
        <Select
          id={`${idPrefix}-status`}
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
          Membership lifecycle only. Payment overdue is tracked separately below
          for monthly and instalment plans.
        </p>
      </div>
      <div className="sm:col-span-2">
        <Label>Payment status</Label>
        {!isInstallmentSchedule(membership.paymentSchedule) ? (
          <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-400">
            Not applicable — this member is on a{" "}
            <span className="text-white">Full payment</span> plan. Instalment
            overdue tracking only applies to Monthly and Instalment
            subscriptions.
          </p>
        ) : form.paymentOverdueOverride ? (
          <div className="mt-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-sm font-medium text-blue-300">
              Overridden by admin
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Training and match access is allowed despite overdue instalment
              rules.
              {form.paymentOverdueOverrideUntil && (
                <>
                  {" "}
                  Override runs until{" "}
                  {format(
                    new Date(form.paymentOverdueOverrideUntil),
                    "d MMM yyyy",
                  )}
                  .
                </>
              )}
              {underlyingPaymentAccess.isOverdue &&
                underlyingPaymentAccess.overduePayment && (
                  <>
                    {" "}
                    Instalment{" "}
                    {underlyingPaymentAccess.overduePayment.installmentNumber ??
                      "—"}{" "}
                    ·{" "}
                    {formatPrice(
                      underlyingPaymentAccess.overduePayment.amount,
                    )}{" "}
                    was due{" "}
                    {format(
                      underlyingPaymentAccess.overduePayment.dueDate,
                      "d MMM yyyy",
                    )}{" "}
                    ({underlyingPaymentAccess.daysPastDue} days ago).
                  </>
                )}
              {underlyingPaymentAccess.isPastDue &&
                !underlyingPaymentAccess.isOverdue && (
                  <>
                    {" "}
                    An instalment is in the {PAYMENT_OVERDUE_GRACE_DAYS}-day
                    grace period.
                  </>
                )}
            </p>
          </div>
        ) : editingPaymentAccess.isOverdue ? (
          <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-300">Payment overdue</p>
            <p className="mt-1 text-sm text-zinc-400">
              {editingPaymentAccess.overduePayment && (
                <>
                  Instalment{" "}
                  {editingPaymentAccess.overduePayment.installmentNumber ?? "—"}{" "}
                  · {formatPrice(editingPaymentAccess.overduePayment.amount)}{" "}
                  was due{" "}
                  {format(
                    editingPaymentAccess.overduePayment.dueDate,
                    "d MMM yyyy",
                  )}{" "}
                  ({editingPaymentAccess.daysPastDue} days ago). Training and
                  match access is blocked after the{" "}
                  {PAYMENT_OVERDUE_GRACE_DAYS}-day grace period.
                </>
              )}
            </p>
          </div>
        ) : editingPaymentAccess.isPastDue ? (
          <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-300">
              Past due (in grace period)
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {editingPaymentAccess.graceDaysRemaining ?? 0} day
              {(editingPaymentAccess.graceDaysRemaining ?? 0) === 1 ? "" : "s"}{" "}
              left before access is blocked.
            </p>
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-sm font-medium text-green-300">
              Payments up to date
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              No overdue instalments for this subscription.
            </p>
          </div>
        )}
      </div>
      {isInstallmentSchedule(membership.paymentSchedule) && (
        <div className="space-y-4 sm:col-span-2">
          {membership.paymentDeferralExcuse &&
            membership.paymentDeferralDueDate && (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
                <p className="text-sm font-medium text-amber-200">
                  Member extension request
                </p>
                <p className="mt-1 text-sm text-zinc-300">
                  Pay-by date requested:{" "}
                  <span className="font-medium text-white">
                    {format(
                      new Date(membership.paymentDeferralDueDate),
                      "d MMM yyyy",
                    )}
                  </span>
                  {membership.paymentDeferralRequestedAt && (
                    <span className="text-zinc-500">
                      {" "}
                      · sent{" "}
                      {format(
                        new Date(membership.paymentDeferralRequestedAt),
                        "d MMM yyyy",
                      )}
                    </span>
                  )}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                  {membership.paymentDeferralExcuse}
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
                      (membership.paymentDeferralDueDate
                        ? format(
                            new Date(membership.paymentDeferralDueDate),
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
                Allow training and match access until the date below, even when
                an instalment is overdue.
              </span>
            </span>
          </label>
          {form.paymentOverdueOverride && (
            <>
              <div>
                <Label htmlFor={`${idPrefix}-override-until`}>
                  Override until
                </Label>
                <Input
                  id={`${idPrefix}-override-until`}
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
                <Label htmlFor={`${idPrefix}-override-note`}>
                  Admin note (optional)
                </Label>
                <Textarea
                  id={`${idPrefix}-override-note`}
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
  );
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const cancelEdit = () => {
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
    setEditingId(membership.id);
    setExpandedId(membership.id);
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
    cancelEdit();
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

    if (editingId === id) cancelEdit();
    if (expandedId === id) setExpandedId(null);
    setMessage("Membership removed.");
    await loadMemberships();
    router.refresh();
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      if (editingId === id) cancelEdit();
      return;
    }
    setExpandedId(id);
  };

  const renderExpandPanel = (membership: Membership) => {
    const isEditing = editingId === membership.id;

    if (isEditing) {
      return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-jackals-red-light">
                Editing
              </p>
              <h4 className="mt-0.5 font-medium text-white">
                {membership.user.name}
              </h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={cancelEdit}
              disabled={loading}
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>

          <MembershipEditFields
            membership={membership}
            form={form}
            setForm={setForm}
            idPrefix={`member-edit-${membership.id}`}
            plans={plans}
          />

          <FormError message={error} />

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={cancelEdit}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      );
    }

    return <MembershipExpandDetails membership={membership} />;
  };

  return (
    <AdminSection
      title="Member subscriptions"
      description="View active memberships and update expiry dates, statuses, or overdue overrides."
    >
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

        {message ? (
          <p className="text-sm text-emerald-300">{message}</p>
        ) : null}
        {!editingId && error ? (
          <p className="text-sm text-jackals-red-light">{error}</p>
        ) : null}

        {filteredMemberships.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
            <p className="font-semibold text-white">
              {hasActiveFilters
                ? "No memberships match your filters."
                : "No memberships yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col />
                  <col className="w-[7.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[6.5rem]" />
                  <col className="w-[4.5rem]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5 font-medium">Name</th>
                    <th className="px-2 py-2.5 font-medium">Plan</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Expires</th>
                    <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredMemberships.map((membership) => {
                    const expanded = expandedId === membership.id;
                    const isEditing = editingId === membership.id;
                    const planShort = isCoachMembershipStatus(membership.status)
                      ? "Coach"
                      : formatMembershipPlanShortName(membership.plan.name);

                    return (
                      <Fragment key={membership.id}>
                        <tr
                          className={cn(
                            "transition",
                            isEditing
                              ? "bg-jackals-red/5"
                              : "bg-white/[0.015] hover:bg-white/[0.03]",
                          )}
                        >
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => toggleExpand(membership.id)}
                              className="group flex min-w-0 items-center gap-1.5 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                  expanded && "rotate-180",
                                )}
                              />
                              <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                                {membership.user.name}
                              </span>
                            </button>
                          </td>
                          <td className="px-2 py-2">
                            <span className="block truncate text-zinc-300">
                              {planShort}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <span
                              className={cn(
                                "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                                membershipStatusBadgeClass(membership.status),
                              )}
                            >
                              {formatMembershipStatusLabel(membership.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs text-zinc-500 whitespace-nowrap">
                            {format(new Date(membership.endDate), "d MMM yyyy")}
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="Edit"
                                onClick={() => startEdit(membership)}
                                className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                title="Delete"
                                disabled={deletingId === membership.id}
                                onClick={() => void handleDelete(membership.id)}
                                className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                              >
                                {deletingId === membership.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr
                            className={cn(
                              isEditing
                                ? "bg-jackals-red/5"
                                : "bg-black/20",
                            )}
                          >
                            <td
                              colSpan={5}
                              className={cn(
                                "px-4 py-4",
                                isEditing &&
                                  "border-y border-jackals-red/40 shadow-lg shadow-jackals-red/10",
                              )}
                            >
                              {renderExpandPanel(membership)}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 lg:hidden">
              {filteredMemberships.map((membership) => {
                const expanded = expandedId === membership.id;
                const isEditing = editingId === membership.id;
                const subscriptionLabel =
                  formatMembershipSubscriptionOrCoachLabel(
                    membership.plan.name,
                    membership.paymentSchedule,
                    membership.status,
                  );

                return (
                  <article
                    key={membership.id}
                    className={cn(
                      "rounded-lg border p-4 transition",
                      isEditing
                        ? "border-jackals-red/40 bg-jackals-red/5 shadow-lg shadow-jackals-red/10"
                        : "border-white/10 bg-white/[0.02]",
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(membership.id)}
                        className="group flex min-w-0 flex-1 items-start gap-1.5 text-left"
                      >
                        <ChevronDown
                          className={cn(
                            "mt-1 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                            expanded && "rotate-180",
                          )}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-white group-hover:text-jackals-gold">
                            {membership.user.name}
                          </p>
                          <p className="truncate text-sm text-zinc-500">
                            {subscriptionLabel}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                membershipStatusBadgeClass(membership.status),
                              )}
                            >
                              {formatMembershipStatusLabel(membership.status)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              Expires{" "}
                              {format(
                                new Date(membership.endDate),
                                "d MMM yyyy",
                              )}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => startEdit(membership)}
                          className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={deletingId === membership.id}
                          onClick={() => void handleDelete(membership.id)}
                          className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                        >
                          {deletingId === membership.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {expanded ? (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        {renderExpandPanel(membership)}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminSection>
  );
}
