"use client";

import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
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
import {
  getPendingPaymentDueState,
  paymentHasUploadedProof,
} from "@/lib/admin-pending-payments";
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
  /** Null for one-off / non-membership fees. */
  membershipId?: string | null;
  installmentNumber?: number | null;
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
type PaymentFilter = "ALL" | "PAID" | "UNPAID" | "OVERDUE";
type SquadFilter = "ALL" | "d2m" | "d3w" | "d3m";
type PlanFilter = "ALL" | string;

/**
 * Member-group payment filters (applied after grouping instalments by user):
 * - UNPAID: any unpaid instalment (still owes something on the plan)
 * - OVERDUE: any overdue unpaid instalment
 * - PAID: current obligation met — no overdue unpaid, and either fully paid
 *   or every instalment due to date is paid (next open one is still upcoming).
 *   Admins use this to see who's paid up for the current period.
 */
type MemberHealthKind =
  | "overdue"
  | "receipt"
  | "awaiting"
  | "upcoming_paid_on_time"
  | "up_to_date"
  | "all_paid";

type MemberHealth = {
  kind: MemberHealthKind;
  label: string;
  detail: string | null;
  tone: string;
};

type MemberPaymentGroup = {
  key: string;
  user: AdminPaymentRecord["user"];
  teamLabel: string | null;
  trainingTeamKey: string | null;
  planName: string | null;
  paymentSchedule: string | null;
  subscriptionLabel: string | null;
  payments: AdminPaymentRecord[];
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  health: MemberHealth;
  nextActionPayment: AdminPaymentRecord | null;
  approvablePayments: AdminPaymentRecord[];
};

const SQUAD_FILTERS: {
  id: SquadFilter;
  label: string;
  keys: string[] | null;
}[] = [
  { id: "ALL", label: "All", keys: null },
  { id: "d2m", label: "d2m", keys: ["DIV2_MENS"] },
  { id: "d3w", label: "d3w", keys: ["DIV3_WOMENS"] },
  { id: "d3m", label: "d3m", keys: ["DIV3_MENS", "DIV4_MENS"] },
];

function matchesSquadFilter(
  trainingTeamKey: string | null | undefined,
  squad: SquadFilter,
) {
  const filter = SQUAD_FILTERS.find((item) => item.id === squad);
  if (!filter?.keys) return true;
  return Boolean(trainingTeamKey && filter.keys.includes(trainingTeamKey));
}

function isPaymentPaid(payment: AdminPaymentRecord) {
  return payment.status === "COMPLETED";
}

function isPaymentOverdue(payment: AdminPaymentRecord) {
  return (
    !isPaymentPaid(payment) &&
    getPendingPaymentDueState(payment.dueDate) === "overdue"
  );
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

/** Paid on or before the due date (or paid with no due date). */
function isPaidOnTime(payment: AdminPaymentRecord) {
  if (!isPaymentPaid(payment)) return false;
  if (!payment.dueDate) return true;
  if (!payment.paidAt) return true;

  const paidDay = new Date(payment.paidAt);
  paidDay.setHours(0, 0, 0, 0);
  const dueDay = new Date(payment.dueDate);
  dueDay.setHours(0, 0, 0, 0);
  return paidDay.getTime() <= dueDay.getTime();
}

function isPaidLate(payment: AdminPaymentRecord) {
  return isPaymentPaid(payment) && !isPaidOnTime(payment);
}

/**
 * The instalment that covers the current window: earliest unpaid by due date,
 * or if everything due-to-date is paid, the latest paid instalment whose due
 * date is still upcoming (paid ahead / on time for the next one).
 */
function findCurrentWindowPayment(payments: AdminPaymentRecord[]) {
  const sorted = sortByDueDate(payments);
  const firstUnpaid = sorted.find((payment) => !isPaymentPaid(payment));
  if (firstUnpaid) return firstUnpaid;

  const upcomingPaid = [...sorted]
    .reverse()
    .find(
      (payment) =>
        isPaymentPaid(payment) &&
        payment.dueDate &&
        getPendingPaymentDueState(payment.dueDate) === "upcoming",
    );
  return upcomingPaid ?? sorted[sorted.length - 1] ?? null;
}

function buildMemberHealth(payments: AdminPaymentRecord[]): MemberHealth {
  const sorted = sortByDueDate(payments);
  const overduePayments = sorted.filter(isPaymentOverdue);
  if (overduePayments.length > 0) {
    const due = overduePayments[0]?.dueDate;
    return {
      kind: "overdue",
      label:
        overduePayments.length === 1
          ? "Overdue"
          : `${overduePayments.length} overdue`,
      detail: due ? new Date(due).toLocaleDateString("en-GB") : null,
      tone: "text-red-300 bg-red-500/15",
    };
  }

  // Needs admin action before celebration states.
  const withReceipt = sorted.find(
    (payment) => !isPaymentPaid(payment) && canApprovePayment(payment),
  );
  if (withReceipt) {
    return {
      kind: "receipt",
      label: "Receipt to review",
      detail: formatPrice(withReceipt.amount, "EUR"),
      tone: "text-blue-300 bg-blue-500/15",
    };
  }

  // Highlight when the next/current window instalment is already paid before its due date.
  const upcomingPaid = sorted.find(
    (payment) =>
      isPaymentPaid(payment) &&
      Boolean(payment.dueDate) &&
      getPendingPaymentDueState(payment.dueDate) === "upcoming" &&
      isPaidOnTime(payment),
  );
  if (upcomingPaid?.dueDate) {
    return {
      kind: "upcoming_paid_on_time",
      label: "Upcoming paid on time",
      detail: new Date(upcomingPaid.dueDate).toLocaleDateString("en-GB"),
      tone: "text-emerald-200 bg-emerald-500/20 ring-1 ring-emerald-400/30",
    };
  }

  const allPaid = sorted.length > 0 && sorted.every(isPaymentPaid);
  if (allPaid) {
    const lateCount = sorted.filter(isPaidLate).length;
    return {
      kind: "all_paid",
      label: lateCount > 0 ? "All paid" : "All paid · on time",
      detail: null,
      tone: "text-emerald-300 bg-emerald-500/10",
    };
  }

  const firstUnpaid = sorted.find((payment) => !isPaymentPaid(payment));
  if (firstUnpaid) {
    const dueState = getPendingPaymentDueState(firstUnpaid.dueDate);
    // Everything due to date is paid; next open instalment is still upcoming.
    if (dueState === "upcoming") {
      const hasPaidSomething = sorted.some(isPaymentPaid);
      if (hasPaidSomething) {
        return {
          kind: "up_to_date",
          label: "Up to date",
          detail: firstUnpaid.dueDate
            ? `Next ${new Date(firstUnpaid.dueDate).toLocaleDateString("en-GB")}`
            : null,
          tone: "text-emerald-300 bg-emerald-500/10",
        };
      }

      // Nothing paid yet, but first instalment isn't due — calm, not alarming.
      return {
        kind: "awaiting",
        label: "Not due yet",
        detail: firstUnpaid.dueDate
          ? `Due ${new Date(firstUnpaid.dueDate).toLocaleDateString("en-GB")}`
          : null,
        tone: "text-sky-200 bg-sky-500/10",
      };
    }

    return {
      kind: "awaiting",
      label: "Awaiting payment",
      detail: firstUnpaid.dueDate
        ? new Date(firstUnpaid.dueDate).toLocaleDateString("en-GB")
        : null,
      tone: "text-amber-200 bg-amber-500/10",
    };
  }

  return {
    kind: "up_to_date",
    label: "Up to date",
    detail: null,
    tone: "text-emerald-300 bg-emerald-500/10",
  };
}

function memberMatchesPaymentFilter(
  group: MemberPaymentGroup,
  filter: PaymentFilter,
) {
  if (filter === "ALL") return true;
  if (filter === "UNPAID") return group.unpaidCount > 0;
  if (filter === "OVERDUE") return group.overdueCount > 0;
  // PAID: current obligation met (see comment on PaymentFilter above)
  if (filter === "PAID") {
    return (
      group.overdueCount === 0 &&
      (group.unpaidCount === 0 ||
        group.health.kind === "upcoming_paid_on_time" ||
        group.health.kind === "up_to_date" ||
        group.health.kind === "all_paid")
    );
  }
  return true;
}

function dueDateLabel(payment: AdminPaymentRecord) {
  if (!payment.dueDate) return "—";

  const text = new Date(payment.dueDate).toLocaleDateString("en-GB");
  if (isPaymentPaid(payment)) {
    return { text, suffix: "", tone: "text-zinc-400" };
  }

  const dueState = getPendingPaymentDueState(payment.dueDate);
  const overdue = dueState === "overdue";

  return {
    text,
    suffix: overdue ? " · overdue" : " · not yet due",
    tone: overdue ? "text-red-400" : "text-sky-300",
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
    if (aDue !== bDue) return aDue - bDue;
    const aInst = a.installmentNumber ?? Number.POSITIVE_INFINITY;
    const bInst = b.installmentNumber ?? Number.POSITIVE_INFINITY;
    return aInst - bInst;
  });
}

/** One row per membership (instalments clubbed); one-off fees stay their own row. */
function groupKeyForPayment(payment: AdminPaymentRecord) {
  const email = payment.user.email.trim().toLowerCase();
  if (payment.membershipId) return `${email}::membership:${payment.membershipId}`;
  return `${email}::payment:${payment.id}`;
}

function groupPaymentsByMember(
  payments: AdminPaymentRecord[],
): MemberPaymentGroup[] {
  const byKey = new Map<string, AdminPaymentRecord[]>();

  for (const payment of payments) {
    const key = groupKeyForPayment(payment);
    const list = byKey.get(key);
    if (list) list.push(payment);
    else byKey.set(key, [payment]);
  }

  const groups: MemberPaymentGroup[] = [];

  for (const [key, rawPayments] of byKey) {
    const sorted = sortByDueDate(rawPayments);
    const first = sorted[0]!;
    const planNames = new Set(
      sorted
        .map((p) => p.subscriptionLabel?.planName)
        .filter((name): name is string => Boolean(name)),
    );
    const schedules = new Set(
      sorted
        .map((p) => p.subscriptionLabel?.paymentSchedule)
        .filter((s): s is string => Boolean(s)),
    );
    const planName = planNames.size === 1 ? [...planNames][0]! : null;
    const paymentSchedule = schedules.size === 1 ? [...schedules][0]! : null;
    const subscriptionLabel =
      planName && paymentSchedule
        ? formatMembershipSubscriptionLabel(planName, paymentSchedule)
        : planNames.size > 1
          ? "Multiple plans"
          : planName
            ? formatMembershipPlanShortName(planName)
            : null;

    let paidCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    let remainingAmount = 0;

    for (const payment of sorted) {
      totalAmount += payment.amount;
      if (isPaymentPaid(payment)) {
        paidCount += 1;
        paidAmount += payment.amount;
      } else {
        unpaidCount += 1;
        remainingAmount += payment.amount;
        if (isPaymentOverdue(payment)) overdueCount += 1;
      }
    }

    const health = buildMemberHealth(sorted);
    const nextActionPayment =
      sorted.find(isPaymentOverdue) ??
      sorted.find((p) => !isPaymentPaid(p) && canApprovePayment(p)) ??
      sorted.find((p) => !isPaymentPaid(p)) ??
      null;

    groups.push({
      key,
      user: first.user,
      teamLabel: first.teamLabel,
      trainingTeamKey: first.trainingTeamKey,
      planName,
      paymentSchedule,
      subscriptionLabel,
      payments: sorted,
      paidCount,
      unpaidCount,
      overdueCount,
      totalAmount,
      paidAmount,
      remainingAmount,
      health,
      nextActionPayment,
      approvablePayments: sorted.filter(canApprovePayment),
    });
  }

  return groups.sort((a, b) => {
    const rank = (g: MemberPaymentGroup) => {
      if (g.overdueCount > 0) return 0;
      if (g.approvablePayments.length > 0) return 1;
      if (g.unpaidCount > 0) return 2;
      return 3;
    };
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;

    const aDue = a.nextActionPayment?.dueDate
      ? new Date(a.nextActionPayment.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    const bDue = b.nextActionPayment?.dueDate
      ? new Date(b.nextActionPayment.dueDate).getTime()
      : Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;

    return a.user.name.localeCompare(b.user.name);
  });
}

function InstalmentProgressDots({
  payments,
  currentId,
}: {
  payments: AdminPaymentRecord[];
  currentId?: string | null;
}) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {payments.map((payment) => {
        const paid = isPaymentPaid(payment);
        const overdue = isPaymentOverdue(payment);
        const receipt = !paid && canApprovePayment(payment);
        const upcomingPaid =
          paid &&
          payment.dueDate &&
          getPendingPaymentDueState(payment.dueDate) === "upcoming" &&
          isPaidOnTime(payment);
        const isCurrent = payment.id === currentId;

        return (
          <span
            key={payment.id}
            title={`${formatPrice(payment.amount, "EUR")} · ${paymentStatusShort(paymentDisplayStatus(payment))}`}
            className={cn(
              "h-2 w-2 rounded-full",
              paid && upcomingPaid && "bg-emerald-400",
              paid && !upcomingPaid && "bg-emerald-600",
              overdue && "bg-red-400",
              receipt && "bg-blue-400",
              !paid && !overdue && !receipt && "bg-zinc-600",
              isCurrent && "ring-2 ring-white/40 ring-offset-1 ring-offset-black",
            )}
          />
        );
      })}
    </div>
  );
}

function HealthBadge({ health }: { health: MemberHealth }) {
  const Icon =
    health.kind === "overdue"
      ? AlertTriangle
      : health.kind === "upcoming_paid_on_time" ||
          health.kind === "all_paid" ||
          health.kind === "up_to_date"
        ? CheckCircle2
        : health.kind === "receipt"
          ? Clock
          : Clock;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        health.tone,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{health.label}</span>
    </span>
  );
}

function InstalmentExpandedRow({
  payment,
  index,
  total,
  loadingId,
  onApprove,
}: {
  payment: AdminPaymentRecord;
  index: number;
  total: number;
  loadingId: string | null;
  onApprove: (paymentId: string, memberName: string) => void;
}) {
  const displayStatus = paymentDisplayStatus(payment);
  const due = dueDateLabel(payment);
  const canApprove = canApprovePayment(payment);
  const paidOnTime = isPaidOnTime(payment);
  const paidLate = isPaidLate(payment);
  const upcomingPaid =
    paidOnTime &&
    payment.dueDate &&
    getPendingPaymentDueState(payment.dueDate) === "upcoming";

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        upcomingPaid
          ? "border-emerald-400/35 bg-emerald-500/10"
          : paidOnTime
            ? "border-emerald-500/20 bg-emerald-500/5"
            : isPaymentOverdue(payment)
              ? "border-red-500/25 bg-red-500/5"
              : "border-white/10 bg-white/[0.02]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-white">
              {payment.installmentNumber != null || total > 1
                ? `Instalment ${payment.installmentNumber ?? index + 1}`
                : payment.description?.trim() || "Fee"}
              {payment.installmentNumber != null && total > 1 ? (
                <span className="font-normal text-zinc-500"> of {total}</span>
              ) : null}
            </p>
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                paymentStatusTone(displayStatus),
              )}
            >
              {paymentStatusShort(displayStatus)}
            </span>
            {upcomingPaid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-400/40">
                <CheckCircle2 className="h-3 w-3" />
                Upcoming paid on time
              </span>
            ) : paidOnTime ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                Paid on time
              </span>
            ) : paidLate ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
                Paid late
              </span>
            ) : null}
          </div>
          <p className="text-sm text-jackals-gold font-semibold">
            {formatPrice(payment.amount, "EUR")}
          </p>
          {typeof due !== "string" ? (
            <p className={cn("text-xs", due.tone)}>
              Due {due.text}
              {due.suffix}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">No due date</p>
          )}
        </div>

        {canApprove ? (
          <Button
            type="button"
            size="sm"
            disabled={loadingId === payment.id}
            onClick={() => void onApprove(payment.id, payment.user.name)}
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
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 text-sm text-zinc-400 lg:grid-cols-2">
        <div className="space-y-1.5">
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
                {new Date(payment.proofSubmittedAt).toLocaleDateString("en-GB")}
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
            <div className="relative h-40 w-full overflow-hidden rounded-md border border-white/10">
              <Image
                src={payment.proofScreenshotUrl}
                alt={`Payment proof for ${payment.user.name}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        ) : !isPaymentPaid(payment) ? (
          <p className="text-sm text-zinc-500">
            No receipt uploaded yet. Approve is only available after the member
            uploads a transfer screenshot.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MemberExpandedDetails({
  group,
  loadingId,
  onApprove,
}: {
  group: MemberPaymentGroup;
  loadingId: string | null;
  onApprove: (paymentId: string, memberName: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
        <p>
          <span className="text-zinc-500">Email:</span> {group.user.email}
        </p>
        {group.subscriptionLabel ? (
          <p>
            <span className="text-zinc-500">Plan:</span> {group.subscriptionLabel}
          </p>
        ) : null}
        {group.teamLabel ? (
          <p>
            <span className="text-zinc-500">Team:</span> {group.teamLabel}
          </p>
        ) : null}
        <p>
          <span className="text-zinc-500">Progress:</span>{" "}
          {group.paidCount} of {group.payments.length} paid ·{" "}
          {formatMembershipEuro(group.paidAmount)} of{" "}
          {formatMembershipEuro(group.totalAmount)}
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          {group.payments.length > 1 ||
          group.payments.some((p) => p.installmentNumber != null)
            ? "Instalments"
            : "Payment"}
        </p>
        {group.payments.map((payment, index) => (
          <InstalmentExpandedRow
            key={payment.id}
            payment={payment}
            index={index}
            total={group.payments.length}
            loadingId={loadingId}
            onApprove={onApprove}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminPaymentQueue({
  payments,
  teams: _teams,
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
  const [teamFilter, setTeamFilter] = useState<SquadFilter>("ALL");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("ALL");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

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
      if (!matchesSquadFilter(payment.trainingTeamKey, teamFilter)) {
        return false;
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

  // Keep full membership instalment sets when search matches any sibling.
  const paymentsForGrouping = useMemo(() => {
    if (!search.trim()) return filterBase;

    const matchedMembershipIds = new Set(
      filterBase
        .map((payment) => payment.membershipId)
        .filter((id): id is string => Boolean(id)),
    );
    const matchedIds = new Set(filterBase.map((payment) => payment.id));

    return payments.filter((payment) => {
      if (!matchesSquadFilter(payment.trainingTeamKey, teamFilter)) {
        return false;
      }
      if (planFilter !== "ALL") {
        if (payment.subscriptionLabel?.planName !== planFilter) return false;
      }
      if (matchedIds.has(payment.id)) return true;
      return Boolean(
        payment.membershipId && matchedMembershipIds.has(payment.membershipId),
      );
    });
  }, [payments, filterBase, search, teamFilter, planFilter]);

  const memberGroups = useMemo(
    () => groupPaymentsByMember(paymentsForGrouping),
    [paymentsForGrouping],
  );

  const filteredGroups = useMemo(
    () =>
      memberGroups.filter((group) =>
        memberMatchesPaymentFilter(group, paymentFilter),
      ),
    [memberGroups, paymentFilter],
  );

  const stats = useMemo(() => {
    let unpaid = 0;
    let paid = 0;
    let overdue = 0;
    let totalRemaining = 0;
    let totalPaid = 0;

    for (const payment of paymentsForGrouping) {
      if (isPaymentPaid(payment)) {
        paid += 1;
        totalPaid += payment.amount;
      } else {
        unpaid += 1;
        totalRemaining += payment.amount;
        if (isPaymentOverdue(payment)) overdue += 1;
      }
    }

    return { unpaid, paid, overdue, totalRemaining, totalPaid };
  }, [paymentsForGrouping]);

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

  const toggleExpanded = (key: string) => {
    setExpandedKey((current) => (current === key ? null : key));
  };

  return (
    <div className="space-y-4">
      <AdminBankStatementImport
        focus="membership"
        onImported={() => {
          setMessage(
            "Bank statement imported. Matching payments were auto-approved.",
          );
          void refreshNotifications();
          router.refresh();
        }}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Unpaid", value: String(stats.unpaid) },
          { label: "Overdue", value: String(stats.overdue) },
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
            <p className="mt-0.5 text-lg font-semibold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-400">
            Membership instalments grouped by member
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
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, reference…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {(
                [
                  { value: "ALL" as const, label: "All" },
                  { value: "UNPAID" as const, label: "Unpaid" },
                  { value: "OVERDUE" as const, label: "Overdue" },
                  { value: "PAID" as const, label: "Paid" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPaymentFilter(option.value)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition",
                    paymentFilter === option.value
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {SQUAD_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTeamFilter(item.id)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium uppercase tracking-wide transition",
                    teamFilter === item.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              className="min-w-[9.5rem]"
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
            {filteredGroups.length} member
            {filteredGroups.length === 1 ? "" : "s"}
            {filteredGroups.length !== memberGroups.length
              ? ` of ${memberGroups.length}`
              : ""}
            {" · "}
            {filterBase.length} instalment
            {filterBase.length === 1 ? "" : "s"}
          </span>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="hover:text-zinc-300"
            >
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

      {filteredGroups.length === 0 ? (
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
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[22%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5 font-medium">Member</th>
                    <th className="px-2 py-2.5 font-medium">Plan</th>
                    <th className="px-2 py-2.5 font-medium">Progress</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Next</th>
                    <th className="px-2 py-2.5 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredGroups.map((group) => {
                    const expanded = expandedKey === group.key;
                    const current = findCurrentWindowPayment(group.payments);
                    const singleApprove =
                      group.approvablePayments.length === 1
                        ? group.approvablePayments[0]!
                        : null;

                    return (
                      <Fragment key={group.key}>
                        <tr
                          className={cn(
                            "bg-white/[0.015] transition hover:bg-white/[0.03]",
                            group.health.kind === "upcoming_paid_on_time" &&
                              "bg-emerald-500/[0.04]",
                            group.overdueCount > 0 && "bg-red-500/[0.03]",
                          )}
                        >
                          <td className="px-2 py-2.5">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(group.key)}
                              className="group flex min-w-0 items-start gap-1.5 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                  expanded && "rotate-180",
                                )}
                              />
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-white group-hover:text-jackals-gold">
                                  {group.user.name}
                                </span>
                                <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                                  {group.user.email}
                                  {group.teamLabel
                                    ? ` · ${group.teamLabel}`
                                    : ""}
                                </span>
                              </span>
                            </button>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="line-clamp-2 text-xs text-zinc-400">
                              {group.subscriptionLabel ?? "—"}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="space-y-1.5">
                              <InstalmentProgressDots
                                payments={group.payments}
                                currentId={current?.id}
                              />
                              <p className="text-xs text-zinc-300">
                                {group.paidCount} of {group.payments.length}{" "}
                                paid
                              </p>
                              <p className="text-[11px] text-zinc-500">
                                {formatMembershipEuro(group.paidAmount)} of{" "}
                                {formatMembershipEuro(group.totalAmount)}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="space-y-1">
                              <HealthBadge health={group.health} />
                              {group.health.detail ? (
                                <p className="text-[11px] text-zinc-500">
                                  {group.health.detail}
                                </p>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-2 py-2.5">
                            {group.nextActionPayment?.dueDate ? (
                              <span
                                className={cn(
                                  "text-xs",
                                  isPaymentOverdue(group.nextActionPayment)
                                    ? "text-red-400"
                                    : "text-zinc-300",
                                )}
                              >
                                {new Date(
                                  group.nextActionPayment.dueDate,
                                ).toLocaleDateString("en-GB")}
                              </span>
                            ) : group.health.kind ===
                                "upcoming_paid_on_time" ||
                              group.health.kind === "all_paid" ? (
                              <span className="text-xs text-emerald-400">—</span>
                            ) : (
                              <span className="text-xs text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {singleApprove ? (
                                <button
                                  type="button"
                                  title="Mark as paid"
                                  disabled={loadingId === singleApprove.id}
                                  onClick={() =>
                                    void approvePayment(
                                      singleApprove.id,
                                      group.user.name,
                                    )
                                  }
                                  className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
                                >
                                  {loadingId === singleApprove.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              ) : group.approvablePayments.length > 1 ? (
                                <button
                                  type="button"
                                  title="Review receipts"
                                  onClick={() => toggleExpanded(group.key)}
                                  className="rounded px-1.5 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-500/10"
                                >
                                  {group.approvablePayments.length} receipts
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="bg-black/20">
                            <td colSpan={6} className="px-4 py-4">
                              <MemberExpandedDetails
                                group={group}
                                loadingId={loadingId}
                                onApprove={approvePayment}
                              />
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
            {filteredGroups.map((group) => {
              const expanded = expandedKey === group.key;
              const current = findCurrentWindowPayment(group.payments);
              const singleApprove =
                group.approvablePayments.length === 1
                  ? group.approvablePayments[0]!
                  : null;

              return (
                <article
                  key={group.key}
                  className={cn(
                    "rounded-lg border border-white/10 bg-white/[0.02] p-4",
                    group.health.kind === "upcoming_paid_on_time" &&
                      "border-emerald-400/30 bg-emerald-500/[0.06]",
                    group.overdueCount > 0 && "border-red-500/25",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(group.key)}
                      className="group flex min-w-0 flex-1 items-start gap-2 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 text-zinc-600 transition",
                          expanded && "rotate-180",
                        )}
                      />
                      <span className="min-w-0 space-y-2">
                        <span className="block">
                          <span className="font-medium text-white group-hover:text-jackals-gold">
                            {group.user.name}
                          </span>
                          <span className="mt-0.5 block truncate text-sm text-zinc-500">
                            {group.user.email}
                          </span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <HealthBadge health={group.health} />
                          <InstalmentProgressDots
                            payments={group.payments}
                            currentId={current?.id}
                          />
                          <span className="text-xs text-zinc-400">
                            {group.paidCount}/{group.payments.length} ·{" "}
                            {formatMembershipEuro(group.paidAmount)}/
                            {formatMembershipEuro(group.totalAmount)}
                          </span>
                        </span>
                        {group.subscriptionLabel || group.teamLabel ? (
                          <span className="block text-xs text-zinc-500">
                            {[group.subscriptionLabel, group.teamLabel]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    {singleApprove ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={loadingId === singleApprove.id}
                        onClick={() =>
                          void approvePayment(
                            singleApprove.id,
                            group.user.name,
                          )
                        }
                      >
                        {loadingId === singleApprove.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>

                  {expanded ? (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <MemberExpandedDetails
                        group={group}
                        loadingId={loadingId}
                        onApprove={approvePayment}
                      />
                    </div>
                  ) : null}
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
