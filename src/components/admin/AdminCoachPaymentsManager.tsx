"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRefreshAdminNotifications } from "@/components/admin/AdminNotificationsProvider";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import type { CoachPaymentItem } from "@/components/coach/CoachPaymentsOverview";
import { CoachPaymentSessionBreakdown } from "@/components/coach/CoachPaymentSessionBreakdown";
import {
  COACH_PAYMENT_STATUS_LABELS,
  coachPaymentMonthKey,
  formatCoachPaymentMonth,
  isCurrentPaymentMonth,
  isFuturePaymentMonth,
  isOverdueCoachPayment,
  isSettledCoachPayment,
  type CoachPaymentStatus,
} from "@/lib/coach-payments-config";
import type { AdminCoachPaymentRow } from "@/lib/coach-payments-config";
import { GALLERY_ACCEPTED_IMAGE_TYPES } from "@/lib/gallery-upload-config";
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

function paymentStatusTone(status: CoachPaymentStatus) {
  return status === "PAID"
    ? "border-green-500/40 bg-green-500/15 text-green-300"
    : "border-amber-500/40 bg-amber-500/15 text-amber-200";
}

export function AdminCoachPaymentsManager({
  initialCoaches,
  ratePerSession,
}: {
  initialCoaches: AdminCoachPaymentRow[];
  ratePerSession: number;
}) {
  const router = useRouter();
  const refreshNotifications = useRefreshAdminNotifications();
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    setExpandedId(null);
  }, [tab, coachFilter, upcomingMonth]);

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
    void refreshNotifications();
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
    void refreshNotifications();
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
    void refreshNotifications();
    router.refresh();
  };

  const renderPaymentDetails = (
    coach: AdminCoachPaymentRow,
    payment: CoachPaymentItem,
    options?: { readOnly?: boolean; statusControlId?: string },
  ) => {
    const status = statuses[payment.id] ?? payment.status;
    const readOnly = options?.readOnly ?? false;
    const statusControlId = options?.statusControlId ?? `status-${payment.id}`;

    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Session breakdown
          </p>
          <CoachPaymentSessionBreakdown
            breakdown={payment.breakdown}
            ratePerSession={ratePerSession}
            className="mt-2"
          />
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">Squad:</span> {coach.teamName || "—"}
          </p>
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">Sessions:</span>{" "}
            {payment.sessionCount} × {formatEuroFee(ratePerSession)}
          </p>
          {coach.email ? (
            <p className="break-all text-sm text-zinc-400">
              <span className="text-zinc-500">Email:</span> {coach.email}
            </p>
          ) : null}

          {!readOnly ? (
            <>
              <div className="max-w-xs">
                <Label htmlFor={statusControlId}>Status</Label>
                <Select
                  id={statusControlId}
                  value={status}
                  onChange={(event) =>
                    setStatuses((current) => ({
                      ...current,
                      [payment.id]: event.target.value as CoachPaymentStatus,
                    }))
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                </Select>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={loadingId === payment.id}
                  onClick={() => savePayment(payment)}
                >
                  {loadingId === payment.id ? "Saving..." : "Save status"}
                </Button>

                <label className="inline-flex cursor-pointer items-center">
                  <input
                    type="file"
                    accept={GALLERY_ACCEPTED_IMAGE_TYPES}
                    className="sr-only"
                    disabled={uploadingId === payment.id}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadInvoice(payment.id, file);
                      event.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-200 hover:bg-white/10">
                    {uploadingId === payment.id
                      ? "Uploading..."
                      : payment.invoiceScreenshotUrl
                        ? "Replace screenshot"
                        : "Upload payment screenshot"}
                  </span>
                </label>

                {payment.invoiceScreenshotUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      removingId === payment.id || uploadingId === payment.id
                    }
                    onClick={() => removeInvoice(payment.id)}
                  >
                    {removingId === payment.id
                      ? "Removing..."
                      : "Remove screenshot"}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}

          {payment.invoiceScreenshotUrl ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                Payment screenshot
              </p>
              <Image
                src={payment.invoiceScreenshotUrl}
                alt={`Payment confirmation for ${coach.name}`}
                width={960}
                height={540}
                className="max-h-56 w-auto rounded-lg border border-white/10 object-contain"
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderPaymentTable = (
    entries: { coach: AdminCoachPaymentRow; payment: CoachPaymentItem }[],
    options?: { readOnly?: boolean; projected?: boolean },
  ) => {
    if (entries.length === 0) {
      return (
        <p className="py-8 text-center text-sm text-zinc-500">
          {tab === "current" && "No payment records for this month."}
          {tab === "past" && "No settled past payments to show."}
          {tab === "overdue" && "No overdue coach payments."}
          {tab === "future" && "No upcoming months to show."}
        </p>
      );
    }

    const totalDue = entries.reduce((sum, { payment }) => sum + payment.amount, 0);
    const readOnly = options?.readOnly ?? false;
    const projected = options?.projected ?? false;

    return (
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          {entries.length} payment{entries.length === 1 ? "" : "s"} ·{" "}
          {formatEuroFee(totalDue)} total
        </p>

        <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col />
              <col className="w-[5.5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[5.25rem]" />
            </colgroup>
            <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-2 py-2.5 font-medium">Coach</th>
                <th className="px-2 py-2.5 font-medium">Month</th>
                <th className="px-2 py-2.5 font-medium">Amount</th>
                <th className="px-2 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {entries.map(({ coach, payment }) => {
                const expanded = expandedId === payment.id;

                return (
                  <Fragment key={`${coach.clubMemberId}-${payment.id}`}>
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
                            {coach.name}
                          </span>
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-xs text-zinc-400">
                        {formatCoachPaymentMonth(payment.year, payment.month)}
                      </td>
                      <td className="px-2 py-2 font-semibold text-jackals-gold">
                        {formatEuroFee(payment.amount)}
                        {projected ? (
                          <span className="ml-1 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-1 py-0.5 text-[10px] font-medium text-sky-200">
                            Est.
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            paymentStatusTone(payment.status),
                          )}
                        >
                          {COACH_PAYMENT_STATUS_LABELS[payment.status]}
                        </span>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-black/20">
                        <td colSpan={4} className="px-4 py-4">
                          {renderPaymentDetails(coach, payment, {
                            readOnly,
                            statusControlId: `status-desktop-${payment.id}`,
                          })}
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
          {entries.map(({ coach, payment }) => {
            const expanded = expandedId === payment.id;

            return (
              <article
                key={`${coach.clubMemberId}-${payment.id}-mobile`}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : payment.id)}
                  className="group flex w-full min-w-0 items-start gap-1.5 text-left"
                >
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                      expanded && "rotate-180",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                        {coach.name}
                      </span>
                      <span className="shrink-0 font-semibold text-jackals-gold">
                        {formatEuroFee(payment.amount)}
                        {projected ? (
                          <span className="ml-1 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-1 py-0.5 text-[10px] font-medium text-sky-200">
                            Est.
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          paymentStatusTone(payment.status),
                        )}
                      >
                        {COACH_PAYMENT_STATUS_LABELS[payment.status]}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatCoachPaymentMonth(payment.year, payment.month)}
                      </span>
                      {coach.teamName ? (
                        <span className="text-xs text-zinc-500">
                          {coach.teamName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
                {expanded ? (
                  <div className="mt-3 border-t border-white/5 pt-3">
                    {renderPaymentDetails(coach, payment, {
                      readOnly,
                      statusControlId: `status-mobile-${payment.id}`,
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
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
          renderPaymentTable(currentEntries)
        ) : tab === "past" ? (
          renderPaymentTable(pastEntries)
        ) : tab === "overdue" ? (
          renderPaymentTable(overdueEntries)
        ) : (
          renderPaymentTable(upcomingEntries, {
            readOnly: true,
            projected: true,
          })
        )}
      </div>
    </AdminSection>
  );
}
