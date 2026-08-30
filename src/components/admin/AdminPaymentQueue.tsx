"use client";

import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Rows3,
  Search,
} from "lucide-react";
import { AdminBankStatementImport } from "@/components/admin/AdminBankStatementImport";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import { formatPrice, cn } from "@/lib/utils";
import { apiApprovePayment } from "@/lib/client-api";
import { getPendingPaymentDueState, paymentHasUploadedProof } from "@/lib/admin-pending-payments";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import {
  formatMembershipPlanShortName,
  formatMembershipSubscriptionLabel,
} from "@/lib/membership-config";

export type AdminPaymentRecord = {
  id: string;
  amount: number;
  status: string;
  paymentReference: string;
  description: string;
  dueDate: string | null;
  proofSubmittedAt: string | null;
  proofScreenshotUrl: string | null;
  paidAt: string | null;
  user: {
    name: string;
    email: string;
  };
  subscriptionLabel: {
    planName: string;
    paymentSchedule: string;
  } | null;
  trainingTeamKey: string | null;
  teamLabel: string | null;
};

type ViewMode = "table" | "cards";
type PaymentFilter = "ALL" | "PAID" | "UNPAID";
type TeamFilter = "ALL" | string;
type PlanFilter = "ALL" | string;

function isPaymentPaid(payment: AdminPaymentRecord) {
  return payment.status === "COMPLETED";
}

function canApprovePayment(payment: AdminPaymentRecord) {
  return payment.status === "PENDING" && paymentHasUploadedProof(payment);
}

function paymentDisplayStatus(payment: AdminPaymentRecord) {
  if (payment.status === "COMPLETED") return "PAID" as const;
  if (payment.proofSubmittedAt && payment.proofScreenshotUrl) {
    return "PROOF_SUBMITTED" as const;
  }
  return "AWAITING" as const;
}

function paymentStatusShort(status: ReturnType<typeof paymentDisplayStatus>) {
  if (status === "PAID") return "Paid";
  if (status === "PROOF_SUBMITTED") return "Receipt";
  return "Unpaid";
}

function paymentStatusTone(status: ReturnType<typeof paymentDisplayStatus>) {
  if (status === "PAID") return "text-emerald-300 bg-emerald-500/10";
  if (status === "PROOF_SUBMITTED") return "text-blue-300 bg-blue-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function dueDateLabel(payment: AdminPaymentRecord) {
  if (!payment.dueDate) return "—";

  const dueState = getPendingPaymentDueState(payment.dueDate);
  const overdue = dueState === "overdue";
  const upcoming = dueState === "upcoming";

  return {
    text: new Date(payment.dueDate).toLocaleDateString("en-GB"),
    suffix: overdue
      ? " · overdue"
      : upcoming
        ? " · not yet due"
        : " · due now",
    tone: overdue
      ? "text-red-400"
      : upcoming
        ? "text-sky-300"
        : "text-zinc-300",
  };
}

function sortByDueDate(payments: AdminPaymentRecord[]) {
  return [...payments].sort((a, b) => {
    const aDue = a.dueDate
      ? new Date(a.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate
      ? new Date(b.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    return aDue - bDue;
  });
}

export function AdminPaymentQueue({
  payments,
  teams,
}: {
  payments: AdminPaymentRecord[];
  teams: { key: string; name: string }[];
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
  const [view, setView] = useState<ViewMode>("table");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("ALL");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const planOptions = useMemo(() => {
    const plans = new Set<string>();
    for (const payment of payments) {
      if (payment.subscriptionLabel?.planName) {
        plans.add(payment.subscriptionLabel.planName);
      }
    }
    return [...plans].sort((a, b) =>
      formatMembershipPlanShortName(a).localeCompare(
        formatMembershipPlanShortName(b),
      ),
    );
  }, [payments]);

  const filterBase = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((payment) => {
      if (teamFilter !== "ALL") {
        if ((payment.trainingTeamKey ?? "") !== teamFilter) return false;
      }
      if (planFilter !== "ALL") {
        if (payment.subscriptionLabel?.planName !== planFilter) return false;
      }
      if (!query) return true;

      const subscriptionLabel = payment.subscriptionLabel
        ? formatMembershipSubscriptionLabel(
            payment.subscriptionLabel.planName,
            payment.subscriptionLabel.paymentSchedule,
          )
        : "";

      const haystack = [
        payment.user.name,
        payment.user.email,
        payment.paymentReference,
        payment.description,
        payment.teamLabel,
        subscriptionLabel,
        payment.amount.toString(),
        formatPrice(payment.amount, "EUR"),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [payments, teamFilter, planFilter, search]);

  const filtered = useMemo(() => {
    const rows = filterBase.filter((payment) => {
      const paid = isPaymentPaid(payment);
      if (paymentFilter === "PAID" && !paid) return false;
      if (paymentFilter === "UNPAID" && paid) return false;
      return true;
    });

    return sortByDueDate(rows);
  }, [filterBase, paymentFilter]);

  const stats = useMemo(() => {
    let unpaid = 0;
    let paid = 0;
    let totalRemaining = 0;
    let totalPaid = 0;

    for (const payment of filterBase) {
      if (isPaymentPaid(payment)) {
        paid += 1;
        totalPaid += payment.amount;
      } else {
        unpaid += 1;
        totalRemaining += payment.amount;
      }
    }

    return { unpaid, paid, totalRemaining, totalPaid };
  }, [filterBase]);

  const approvePayment = async (paymentId: string, memberName: string) => {
    const payment = payments.find((row) => row.id === paymentId);
    if (!payment || !canApprovePayment(payment)) {
      setError("Upload a payment receipt before approving.");
      return;
    }

    setLoadingId(paymentId);
    setError(null);
    setMessage(null);

    const result = await apiApprovePayment(paymentId);
    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(`Payment approved for ${memberName}.`);
    void refreshNotifications();
    router.refresh();
  };

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentFilter("ALL");
    setTeamFilter("ALL");
    setPlanFilter("ALL");
  };

  const hasFilters =
    search.trim() !== "" ||
    paymentFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    planFilter !== "ALL";

  return (
    <div className="space-y-4">
      <AdminBankStatementImport
        focus="membership"
        onImported={() => {
          setMessage("Bank statement imported. Matching payments were auto-approved.");
          void refreshNotifications();
          router.refresh();
        }}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Unpaid", value: String(stats.unpaid) },
          { label: "Paid", value: String(stats.paid) },
          {
            label: "Total remaining",
            value: formatMembershipEuro(stats.totalRemaining),
          },
          {
            label: "Total paid",
            value: formatMembershipEuro(stats.totalPaid),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
          >
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-400">
            Membership instalments and one-off fees
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden overflow-hidden rounded-lg border border-white/10 lg:flex">
              {(
                [
                  { id: "table" as const, icon: Rows3, label: "Table" },
                  { id: "cards" as const, icon: LayoutGrid, label: "Cards" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
                    view === option.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={refresh}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, reference…"
                className="pl-9"
              />
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-lg border border-white/10">
              {(
                [
                  { value: "ALL" as const, label: "All" },
                  { value: "UNPAID" as const, label: "Unpaid" },
                  { value: "PAID" as const, label: "Paid" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentFilter(option.value)}
                  className={cn(
                    "px-4 py-2 text-xs font-medium transition",
                    paymentFilter === option.value
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value as TeamFilter)}
            >
              <option value="ALL">All teams</option>
              {teams.map((team) => (
                <option key={team.key} value={team.key}>
                  {team.name}
                </option>
              ))}
            </Select>
            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
            >
              <option value="ALL">All plans</option>
              {planOptions.map((planName) => (
                <option key={planName} value={planName}>
                  {formatMembershipPlanShortName(planName)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {filtered.length} shown
            {filtered.length !== payments.length ? ` of ${payments.length}` : ""}
          </span>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="hover:text-zinc-300">
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="font-semibold text-white">No matching payments</p>
          <p className="mt-1 text-sm text-zinc-500">
            {payments.length === 0
              ? "No membership payments yet."
              : "Try changing your filters or search."}
          </p>
        </div>
      ) : (
        <>
          {view === "table" ? (
            <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col />
                  <col className="w-[4.5rem]" />
                  <col className="w-[5.25rem]" />
                  <col className="w-[7rem]" />
                  <col className="w-[3rem]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5 font-medium">Member</th>
                    <th className="px-2 py-2.5 font-medium">Amount</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Due</th>
                    <th className="px-2 py-2.5 text-right font-medium"></th>
                  </tr>
                </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map((payment) => {
                const expanded = expandedId === payment.id;
                const displayStatus = paymentDisplayStatus(payment);
                const due = dueDateLabel(payment);
                const subscriptionLabel = payment.subscriptionLabel
                  ? formatMembershipSubscriptionLabel(
                      payment.subscriptionLabel.planName,
                      payment.subscriptionLabel.paymentSchedule,
                    )
                  : null;
                const canApprove = canApprovePayment(payment);

                return (
                  <Fragment key={payment.id}>
                    <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : payment.id)
                          }
                          className="group flex min-w-0 items-center gap-1.5 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                              expanded && "rotate-180",
                            )}
                          />
                          <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                            {payment.user.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-2 py-2 font-semibold text-jackals-gold">
                        {formatPrice(payment.amount, "EUR")}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                            paymentStatusTone(displayStatus),
                          )}
                        >
                          {paymentStatusShort(displayStatus)}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        {typeof due === "string" ? (
                          <span className="text-zinc-500">{due}</span>
                        ) : (
                          <span className={cn("text-xs", due.tone)}>
                            {due.text}
                            <span className="hidden text-zinc-500 xl:inline">
                              {due.suffix}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {canApprove ? (
                            <button
                              type="button"
                              title="Mark as paid"
                              disabled={loadingId === payment.id}
                              onClick={() =>
                                void approvePayment(payment.id, payment.user.name)
                              }
                              className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
                            >
                              {loadingId === payment.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-black/20">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-2 text-sm text-zinc-400">
                              <p>
                                <span className="text-zinc-500">Email:</span>{" "}
                                {payment.user.email}
                              </p>
                              {subscriptionLabel ? (
                                <p>
                                  <span className="text-zinc-500">Plan:</span>{" "}
                                  {subscriptionLabel}
                                </p>
                              ) : null}
                              {payment.teamLabel ? (
                                <p>
                                  <span className="text-zinc-500">Team:</span>{" "}
                                  {payment.teamLabel}
                                </p>
                              ) : null}
                              <p>
                                <span className="text-zinc-500">Reference:</span>{" "}
                                <span className="font-mono text-xs text-zinc-300">
                                  {payment.paymentReference}
                                </span>
                              </p>
                              {payment.description ? (
                                <p>
                                  <span className="text-zinc-500">Description:</span>{" "}
                                  {payment.description}
                                </p>
                              ) : null}
                              {payment.proofSubmittedAt ? (
                                <p>
                                  <span className="text-zinc-500">Receipt:</span>{" "}
                                  <span className="text-emerald-300">
                                    Uploaded{" "}
                                    {new Date(
                                      payment.proofSubmittedAt,
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                </p>
                              ) : null}
                              {payment.paidAt ? (
                                <p>
                                  <span className="text-zinc-500">Paid:</span>{" "}
                                  {new Date(payment.paidAt).toLocaleDateString("en-GB")}
                                </p>
                              ) : null}
                              {payment.proofScreenshotUrl ? (
                                <a
                                  href={payment.proofScreenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-jackals-gold hover:underline"
                                >
                                  View receipt
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : null}
                            </div>

                            {payment.proofScreenshotUrl ? (
                              <div>
                                <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                                  Payment screenshot
                                </p>
                                <div className="relative h-48 w-full overflow-hidden rounded-md border border-white/10">
                                  <Image
                                    src={payment.proofScreenshotUrl}
                                    alt={`Payment proof for ${payment.user.name}`}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-500">
                                No receipt uploaded yet. Approve is only available
                                after the member uploads a transfer screenshot.
                              </p>
                            )}

                            {canApprove ? (
                              <div className="lg:col-span-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={loadingId === payment.id}
                                  onClick={() =>
                                    void approvePayment(
                                      payment.id,
                                      payment.user.name,
                                    )
                                  }
                                >
                                  {loadingId === payment.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Approving…
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="h-4 w-4" />
                                      Mark as paid
                                    </>
                                  )}
                                </Button>
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
            </div>
          ) : null}

          <div className={cn("space-y-2", view === "table" && "lg:hidden")}>
          {filtered.map((payment) => {
            const displayStatus = paymentDisplayStatus(payment);
            const canApprove = canApprovePayment(payment);
            const subscriptionLabel = payment.subscriptionLabel
              ? formatMembershipSubscriptionLabel(
                  payment.subscriptionLabel.planName,
                  payment.subscriptionLabel.paymentSchedule,
                )
              : null;
            const due = dueDateLabel(payment);
            return (
              <article
                key={payment.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">
                      {payment.user.name}{" "}
                      <span className="text-jackals-gold">
                        {formatPrice(payment.amount, "EUR")}
                      </span>
                    </p>
                    <p className="truncate text-sm text-zinc-500">
                      {payment.user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                          paymentStatusTone(displayStatus),
                        )}
                      >
                        {paymentStatusShort(displayStatus)}
                      </span>
                      {typeof due !== "string" ? (
                        <span className={cn("text-xs", due.tone)}>
                          Due {due.text}
                          {due.suffix}
                        </span>
                      ) : null}
                      {subscriptionLabel ? (
                        <span className="text-xs text-zinc-500">
                          {subscriptionLabel}
                        </span>
                      ) : null}
                      {payment.teamLabel ? (
                        <span className="text-xs text-zinc-500">
                          {payment.teamLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {canApprove ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={loadingId === payment.id}
                      onClick={() =>
                        void approvePayment(payment.id, payment.user.name)
                      }
                    >
                      {loadingId === payment.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : null}
                </div>
              </article>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}

/** @deprecated Use AdminPaymentRecord */
export type AdminPendingPayment = AdminPaymentRecord;