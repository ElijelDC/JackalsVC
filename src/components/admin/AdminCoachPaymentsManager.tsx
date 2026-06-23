"use client";

import Image from "next/image";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label, Select } from "@/components/ui/Input";
import type { CoachPaymentItem } from "@/components/coach/CoachPaymentsOverview";
import {
  COACH_PAYMENT_STATUS_LABELS,
  coachPaymentMonthKey,
  coachTrainingPayItemLabel,
  formatCoachPaymentMonth,
  isCurrentPaymentMonth,
  isFuturePaymentMonth,
  isOverdueCoachPayment,
  isSettledCoachPayment,
  type CoachPaymentStatus,
} from "@/lib/coach-payments-config";
import type { AdminCoachPaymentRow } from "@/lib/coach-payments-config";
import { apiDelete, apiGet, apiPostForm, apiPut } from "@/lib/client-api";
import { formatEuroFee } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PaymentsTab = "current" | "past" | "overdue" | "future";

const TABS: { id: PaymentsTab; label: string }[] = [
  { id: "current", label: "This month" },
  { id: "past", label: "Past" },
  { id: "overdue", label: "Overdue" },
  { id: "future", label: "Upcoming" },
];

function CoachPaymentAdminCard({
  coach,
  payment,
  ratePerSession,
  status,
  onStatusChange,
  onSave,
  onUpload,
  onRemove,
  loading,
  uploading,
  removing,
  readOnly = false,
  projected = false,
}: {
  coach: AdminCoachPaymentRow;
  payment: CoachPaymentItem;
  ratePerSession: number;
  status: CoachPaymentStatus;
  onStatusChange: (status: CoachPaymentStatus) => void;
  onSave: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  loading: boolean;
  uploading: boolean;
  removing: boolean;
  readOnly?: boolean;
  projected?: boolean;
}) {
  const { breakdown } = payment;
  const now = new Date();

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-medium text-white">{coach.name}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {coach.teamName}
              {coach.email ? ` · ${coach.email}` : ""}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {formatCoachPaymentMonth(payment.year, payment.month)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-2xl font-bold",
                payment.status === "PAID" && !projected
                  ? "text-green-300"
                  : "text-white",
              )}
            >
              {formatEuroFee(payment.amount)}
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              {breakdown.billableCount} payable × {formatEuroFee(ratePerSession)}
            </p>
            {projected && (
              <span className="mt-2 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200">
                Projected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-white/10 px-5 py-4 sm:gap-3 sm:px-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-lg font-bold text-white">{breakdown.billableCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            Payable
          </p>
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-3 text-center">
          <p className="text-lg font-bold text-rose-300">
            {breakdown.cantAttendCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-rose-300/70">
            Can&apos;t attend
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/30 px-3 py-3 text-center">
          <p className="text-lg font-bold text-zinc-400">
            {breakdown.cancelledCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
            Cancelled
          </p>
        </div>
      </div>

      {breakdown.sessions.length > 0 && (
        <ul className="max-h-56 space-y-2 overflow-y-auto border-b border-white/10 px-5 py-4 sm:px-6">
          {breakdown.sessions.map((item) => (
            <li
              key={item.eventId}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
                item.cancelled
                  ? "border-zinc-700/50 bg-zinc-900/40"
                  : item.payable
                    ? "border-green-500/20 bg-green-500/[0.06]"
                    : "border-rose-500/20 bg-rose-500/[0.06]",
              )}
            >
              <span className="text-zinc-300">
                {format(new Date(item.startDate), "EEE d MMM · HH:mm")}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  item.payable
                    ? "text-green-300"
                    : item.cancelled
                      ? "text-zinc-500"
                      : "text-rose-300",
                )}
              >
                {coachTrainingPayItemLabel(item, now)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 sm:px-6">
            <div>
              <Label htmlFor={`status-${payment.id}`}>Status</Label>
              <Select
                id={`status-${payment.id}`}
                value={status}
                onChange={(event) =>
                  onStatusChange(event.target.value as CoachPaymentStatus)
                }
              >
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 px-5 py-4 sm:px-6">
            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={onSave}
            >
              {loading ? "Saving..." : "Save status"}
            </Button>

            <label className="inline-flex cursor-pointer items-center">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUpload(file);
                  event.target.value = "";
                }}
              />
              <span className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200 hover:bg-white/10">
                {uploading
                  ? "Uploading..."
                  : payment.invoiceScreenshotUrl
                    ? "Replace screenshot"
                    : "Upload payment screenshot"}
              </span>
            </label>

            {payment.invoiceScreenshotUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={removing || uploading}
                onClick={onRemove}
              >
                {removing ? "Removing..." : "Remove screenshot"}
              </Button>
            )}

            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                payment.status === "PAID"
                  ? "border-green-500/40 bg-green-500/15 text-green-300"
                  : "border-amber-500/40 bg-amber-500/15 text-amber-200",
              )}
            >
              {COACH_PAYMENT_STATUS_LABELS[payment.status]}
            </span>
          </div>
        </>
      )}

      {payment.invoiceScreenshotUrl && (
        <div className="border-t border-white/10 px-5 py-4 sm:px-6">
          <p className="mb-3 text-sm font-medium text-zinc-300">
            Payment screenshot
          </p>
          <Image
            src={payment.invoiceScreenshotUrl}
            alt={`Payment confirmation for ${coach.name}`}
            width={960}
            height={540}
            className="max-h-72 w-auto rounded-lg border border-white/10 object-contain"
            unoptimized
          />
        </div>
      )}
    </Card>
  );
}

export function AdminCoachPaymentsManager({
  initialCoaches,
  ratePerSession,
}: {
  initialCoaches: AdminCoachPaymentRow[];
  ratePerSession: number;
}) {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [coaches, setCoaches] = useState(initialCoaches);
  const [tab, setTab] = useState<PaymentsTab>("current");
  const [coachFilter, setCoachFilter] = useState("all");
  const [upcomingMonth, setUpcomingMonth] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, CoachPaymentStatus>>(
    () =>
      Object.fromEntries(
        initialCoaches.flatMap((coach) =>
          coach.payments.map((payment) => [payment.id, payment.status]),
        ),
      ),
  );

  const reload = useCallback(async () => {
    const result = await apiGet<{ coaches: AdminCoachPaymentRow[] }>(
      "/api/admin/coach-payments",
    );
    if (result.ok) {
      setCoaches(result.data.coaches);
      setStatuses(
        Object.fromEntries(
          result.data.coaches.flatMap((coach) =>
            coach.payments.map((payment) => [payment.id, payment.status]),
          ),
        ),
      );
    }
  }, []);

  const visibleCoaches = useMemo(() => {
    if (coachFilter === "all") return coaches;
    return coaches.filter((coach) => coach.clubMemberId === coachFilter);
  }, [coachFilter, coaches]);

  const upcomingMonthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const coach of visibleCoaches) {
      for (const payment of coach.payments) {
        if (
          isFuturePaymentMonth(payment.year, payment.month, now) &&
          payment.breakdown.totalScheduled > 0
        ) {
          keys.add(coachPaymentMonthKey(payment.year, payment.month));
        }
      }
    }
    return [...keys].sort();
  }, [visibleCoaches, now]);

  useEffect(() => {
    if (upcomingMonthOptions.length === 0) {
      setUpcomingMonth("");
      return;
    }
    if (!upcomingMonth || !upcomingMonthOptions.includes(upcomingMonth)) {
      setUpcomingMonth(upcomingMonthOptions[0]);
    }
  }, [upcomingMonth, upcomingMonthOptions]);

  const currentEntries = useMemo(() => {
    return visibleCoaches.flatMap((coach) => {
      const payment = coach.payments.find((item) =>
        isCurrentPaymentMonth(item.year, item.month, now),
      );
      return payment ? [{ coach, payment }] : [];
    });
  }, [visibleCoaches, now]);

  const pastEntries = useMemo(() => {
    return visibleCoaches
      .flatMap((coach) =>
        coach.payments
          .filter((payment) => isSettledCoachPayment(payment, now))
          .map((payment) => ({ coach, payment })),
      )
      .sort(
        (a, b) =>
          b.payment.year * 12 +
          b.payment.month -
          (a.payment.year * 12 + a.payment.month),
      );
  }, [visibleCoaches, now]);

  const overdueEntries = useMemo(() => {
    return visibleCoaches
      .flatMap((coach) =>
        coach.payments
          .filter((payment) => isOverdueCoachPayment(payment, now))
          .map((payment) => ({ coach, payment })),
      )
      .sort(
        (a, b) =>
          a.payment.year * 12 +
          a.payment.month -
          (b.payment.year * 12 + b.payment.month),
      );
  }, [visibleCoaches, now]);

  const upcomingEntries = useMemo(() => {
    if (!upcomingMonth) return [];

    return visibleCoaches.flatMap((coach) => {
      const payment = coach.payments.find(
        (item) =>
          coachPaymentMonthKey(item.year, item.month) === upcomingMonth &&
          isFuturePaymentMonth(item.year, item.month, now) &&
          item.breakdown.totalScheduled > 0,
      );
      return payment ? [{ coach, payment }] : [];
    });
  }, [visibleCoaches, upcomingMonth, now]);

  const savePayment = async (payment: CoachPaymentItem) => {
    setLoadingId(payment.id);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/admin/coach-payments/${payment.id}`, {
      sessionCount: payment.breakdown.billableCount,
      status: statuses[payment.id] ?? payment.status,
    });

    setLoadingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Coach payment updated.");
    await reload();
    router.refresh();
  };

  const uploadInvoice = async (paymentId: string, file: File) => {
    setUploadingId(paymentId);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("screenshot", file);

    const result = await apiPostForm(
      `/api/admin/coach-payments/${paymentId}/invoice`,
      formData,
    );

    setUploadingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Invoice screenshot uploaded and payment marked paid.");
    await reload();
    router.refresh();
  };

  const removeInvoice = async (paymentId: string) => {
    if (
      !confirm(
        "Remove this payment screenshot? The coach will no longer see a confirmation until a new one is uploaded and marked paid.",
      )
    ) {
      return;
    }

    setRemovingId(paymentId);
    setError(null);
    setMessage(null);

    const result = await apiDelete(
      `/api/admin/coach-payments/${paymentId}/invoice`,
      "Failed to remove screenshot",
    );

    setRemovingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Payment screenshot removed.");
    await reload();
    router.refresh();
  };

  const renderPaymentCards = (
    entries: { coach: AdminCoachPaymentRow; payment: CoachPaymentItem }[],
    options?: { readOnly?: boolean; projected?: boolean },
  ) => {
    if (entries.length === 0) {
      return (
        <p className="text-sm text-zinc-500">
          {tab === "current" && "No payment records for this month."}
          {tab === "past" && "No settled past payments to show."}
          {tab === "overdue" && "No overdue coach payments."}
          {tab === "future" && "No upcoming months to show."}
        </p>
      );
    }

    return (
      <div className="space-y-5">
        {entries.map(({ coach, payment }) => (
          <CoachPaymentAdminCard
            key={`${coach.clubMemberId}-${payment.id}`}
            coach={coach}
            payment={payment}
            ratePerSession={ratePerSession}
            status={statuses[payment.id] ?? payment.status}
            onStatusChange={(status) =>
              setStatuses((current) => ({ ...current, [payment.id]: status }))
            }
            onSave={() => savePayment(payment)}
            onUpload={(file) => uploadInvoice(payment.id, file)}
            onRemove={() => removeInvoice(payment.id)}
            loading={loadingId === payment.id}
            uploading={uploadingId === payment.id}
            removing={removingId === payment.id}
            readOnly={options?.readOnly}
            projected={options?.projected}
          />
        ))}
      </div>
    );
  };

  return (
    <AdminSection
      title="Coach payments"
      description={`Pay coaches €${ratePerSession} per payable training each month. Amounts are calculated from squad sessions — can't attend responses are deducted automatically.`}
    >
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {message && <p className="text-sm text-green-300">{message}</p>}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        {coaches.length > 1 && (
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <Label htmlFor="coach-filter">Coach</Label>
            <Select
              id="coach-filter"
              value={coachFilter}
              onChange={(event) => setCoachFilter(event.target.value)}
            >
              <option value="all">All paid coaches</option>
              {coaches.map((coach) => (
                <option key={coach.clubMemberId} value={coach.clubMemberId}>
                  {coach.name}
                  {coach.teamName ? ` · ${coach.teamName}` : ""}
                </option>
              ))}
            </Select>
          </div>
        )}

        {tab === "future" && upcomingMonthOptions.length > 0 && (
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <Label htmlFor="upcoming-month">Month</Label>
            <Select
              id="upcoming-month"
              value={upcomingMonth}
              onChange={(event) => setUpcomingMonth(event.target.value)}
            >
              {upcomingMonthOptions.map((key) => {
                const [year, month] = key.split("-").map(Number);
                return (
                  <option key={key} value={key}>
                    {formatCoachPaymentMonth(year, month)}
                  </option>
                );
              })}
            </Select>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((item) => {
          const overdueCount =
            item.id === "overdue" ? overdueEntries.length : 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                tab === item.id
                  ? "border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
                item.id === "overdue" &&
                  overdueCount > 0 &&
                  tab !== "overdue" &&
                  "border-amber-500/30 text-amber-200",
              )}
            >
              {item.label}
              {overdueCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-amber-100">
                  {overdueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {visibleCoaches.length === 0 ? (
          <p className="text-sm text-zinc-500">No paid coaches to show.</p>
        ) : tab === "current" ? (
          renderPaymentCards(currentEntries)
        ) : tab === "past" ? (
          renderPaymentCards(pastEntries)
        ) : tab === "overdue" ? (
          renderPaymentCards(overdueEntries)
        ) : (
          renderPaymentCards(upcomingEntries, { readOnly: true, projected: true })
        )}
      </div>
    </AdminSection>
  );
}
