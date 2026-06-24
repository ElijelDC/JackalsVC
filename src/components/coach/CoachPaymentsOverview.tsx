"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { X } from "lucide-react";
import { DashboardSection } from "@/components/layout/DashboardSection";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  COACH_PAYMENT_STATUS_LABELS,
  coachCanViewPaymentConfirmation,
  coachTrainingPayItemLabel,
  formatCoachPaymentMonth,
  isCurrentPaymentMonth,
  isFuturePaymentMonth,
  isSettledCoachPayment,
  type CoachPaymentItem,
  type CoachPaymentStatus,
  type CoachTrainingPayItem,
} from "@/lib/coach-payments-config";
import { formatEuroFee } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type { CoachPaymentItem };

type PaymentsTab = "current" | "past" | "future";

const TABS: { id: PaymentsTab; label: string }[] = [
  { id: "current", label: "This month" },
  { id: "past", label: "Past" },
  { id: "future", label: "Upcoming" },
];

function statusBadgeClass(status: CoachPaymentStatus) {
  return status === "PAID"
    ? "border-green-500/40 bg-green-500/15 text-green-300"
    : "border-amber-500/40 bg-amber-500/15 text-amber-200";
}

function sessionRowClass(item: CoachTrainingPayItem) {
  if (item.cancelled) return "border-zinc-700/50 bg-zinc-900/40";
  if (!item.payable) return "border-rose-500/20 bg-rose-500/[0.06]";
  return "border-green-500/20 bg-green-500/[0.06]";
}

function sessionLabelClass(item: CoachTrainingPayItem) {
  if (item.cancelled) return "text-zinc-500";
  if (!item.payable) return "text-rose-300";
  return "text-green-300";
}

function TrainingBreakdown({
  payment,
  ratePerSession,
  showInvoice = true,
}: {
  payment: CoachPaymentItem;
  ratePerSession: number;
  showInvoice?: boolean;
}) {
  const { breakdown } = payment;
  const now = new Date();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-xl font-bold text-white">{breakdown.billableCount}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            Payable
          </p>
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.06] px-3 py-3 text-center">
          <p className="text-xl font-bold text-rose-300">
            {breakdown.cantAttendCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-rose-300/70">
            Can&apos;t attend
          </p>
        </div>
        <div className="rounded-lg border border-zinc-700/40 bg-zinc-900/30 px-3 py-3 text-center">
          <p className="text-xl font-bold text-zinc-400">
            {breakdown.cancelledCount}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">
            Cancelled
          </p>
        </div>
      </div>

      <p className="text-sm text-zinc-400">
        {breakdown.billableCount} payable training
        {breakdown.billableCount === 1 ? "" : "s"} × {formatEuroFee(ratePerSession)}
        {breakdown.cantAttendCount > 0 && (
          <>
            {" "}
            · {breakdown.cantAttendCount} deducted for can&apos;t attend
          </>
        )}
      </p>

      {breakdown.sessions.length > 0 ? (
        <ul className="space-y-2">
          {breakdown.sessions.map((item) => (
            <li
              key={item.eventId}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
                sessionRowClass(item),
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {format(new Date(item.startDate), "EEE d MMM · HH:mm")}
                </p>
                {item.location && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {item.location}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    item.payable ? "text-white" : "text-zinc-500",
                  )}
                >
                  {formatEuroFee(item.amount)}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[11px] font-medium",
                    sessionLabelClass(item),
                  )}
                >
                  {coachTrainingPayItemLabel(item, now)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">No training sessions scheduled.</p>
      )}

      {showInvoice && <PaymentConfirmation payment={payment} />}
    </div>
  );
}

function PaymentConfirmation({ payment }: { payment: CoachPaymentItem }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const screenshotUrl = payment.invoiceScreenshotUrl;

  if (coachCanViewPaymentConfirmation(payment) && screenshotUrl) {
    return (
      <>
        <div className="border-t border-white/10 pt-4">
          <p className="mb-3 text-sm font-medium text-zinc-300">
            Payment confirmation
          </p>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="block w-full max-w-[280px] cursor-zoom-in overflow-hidden rounded-lg border border-white/10 bg-black/20 text-left transition-colors hover:border-white/20 sm:max-w-xs"
          >
            <div className="relative h-36 w-full sm:h-40">
              <Image
                src={screenshotUrl}
                alt={`Payment confirmation for ${formatCoachPaymentMonth(payment.year, payment.month)}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </button>
          <p className="mt-2 text-xs text-zinc-500">
            Click to view
            {payment.paidAt && (
              <>
                {" "}
                · Marked paid{" "}
                {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </>
            )}
          </p>
        </div>

        <Modal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          title="Payment confirmation"
          className="max-w-4xl"
        >
          <div className="relative h-[min(70vh,36rem)] w-full">
            <Image
              src={screenshotUrl}
              alt={`Payment confirmation for ${formatCoachPaymentMonth(payment.year, payment.month)}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="border-t border-white/10 pt-4">
      <p className="text-sm text-zinc-500">
        {payment.status === "PAID"
          ? "Paid — confirmation screenshot will appear here once uploaded by the club."
          : "Pending — the club will upload a payment confirmation once your salary is transferred."}
      </p>
    </div>
  );
}

function MonthSummaryCard({
  payment,
  ratePerSession,
  compact = false,
}: {
  payment: CoachPaymentItem;
  ratePerSession: number;
  compact?: boolean;
}) {
  const isFuture = isFuturePaymentMonth(payment.year, payment.month);

  return (
    <Card className={cn("overflow-hidden p-0", compact && "border-white/10")}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="font-medium text-white">
            {formatCoachPaymentMonth(payment.year, payment.month)}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {payment.breakdown.billableCount} payable
            {payment.breakdown.cantAttendCount > 0 &&
              ` · ${payment.breakdown.cantAttendCount} can't attend`}
          </p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-lg font-semibold",
              payment.status === "PAID" ? "text-green-300" : "text-white",
            )}
          >
            {formatEuroFee(payment.amount)}
          </p>
          {!isFuture && (
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                statusBadgeClass(payment.status),
              )}
            >
              {COACH_PAYMENT_STATUS_LABELS[payment.status]}
            </span>
          )}
          {isFuture && (
            <span className="mt-2 inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200">
              Projected
            </span>
          )}
        </div>
      </div>

      {!compact && (
        <div className="border-t border-white/10 px-5 py-4 sm:px-6">
          <TrainingBreakdown
            payment={payment}
            ratePerSession={ratePerSession}
          />
        </div>
      )}
    </Card>
  );
}

export function CoachPaymentsOverview({
  payments,
  ratePerSession,
  teamName,
}: {
  payments: CoachPaymentItem[];
  ratePerSession: number;
  teamName: string;
}) {
  const [tab, setTab] = useState<PaymentsTab>("current");
  const [dismissedPaymentSchedule, setDismissedPaymentSchedule] = useState(false);
  const [showAllFuture, setShowAllFuture] = useState(false);
  const now = new Date();

  useEffect(() => {
    // Check if user has already dismissed the payment schedule info
    const isDismissed = localStorage.getItem("paymentScheduleDismissed") === "true";
    setDismissedPaymentSchedule(isDismissed);
  }, []);

  const handleDismissPaymentSchedule = () => {
    localStorage.setItem("paymentScheduleDismissed", "true");
    setDismissedPaymentSchedule(true);
  };

  const { current, past, future } = useMemo(() => {
    const currentPayment =
      payments.find((payment) =>
        isCurrentPaymentMonth(payment.year, payment.month, now),
      ) ?? null;

    const pastPayments = payments
      .filter((payment) => isSettledCoachPayment(payment, now))
      .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));

    const futurePayments = payments
      .filter(
        (payment) =>
          isFuturePaymentMonth(payment.year, payment.month, now) &&
          payment.breakdown.totalScheduled > 0,
      )
      .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

    return {
      current: currentPayment,
      past: pastPayments,
      future: futurePayments,
    };
  }, [payments, now]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light"
                : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!dismissedPaymentSchedule && (
        <Card className="border-jackals-red/15 bg-jackals-red/4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="font-medium text-white">Payment Schedule</p>
              <p className="text-sm text-zinc-400">
                Payments are made on the <strong>last Friday of every month</strong>. Your payment is calculated based on billable training sessions for that month. Sessions marked as "can't attend" are deducted from your total.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDismissPaymentSchedule}
              className="shrink-0 text-zinc-500 hover:text-white"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </Card>
      )}

      {tab === "current" && (
        <DashboardSection
          title={current ? formatCoachPaymentMonth(current.year, current.month) : "This month"}
          description={`€${ratePerSession} per payable training for ${teamName}. Sessions you mark as can't attend are deducted.`}
        >
          {current ? (
            <Card className="overflow-hidden border-jackals-red/20 bg-gradient-to-br from-jackals-red/[0.06] to-transparent p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
                <div>
                  <p className="text-sm text-zinc-400">Amount due</p>
                  <p className="mt-1 font-display text-3xl font-bold text-white">
                    {formatEuroFee(current.amount)}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
                    statusBadgeClass(current.status),
                  )}
                >
                  {COACH_PAYMENT_STATUS_LABELS[current.status]}
                </span>
              </div>
              <div className="px-5 py-5 sm:px-6">
                <TrainingBreakdown
                  payment={current}
                  ratePerSession={ratePerSession}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-sm text-zinc-400">
                No payment record for this month yet.
              </p>
            </Card>
          )}
        </DashboardSection>
      )}

      {tab === "past" && (
        <DashboardSection
          title="Past payments"
          description="Previous months — settled payments with training that took place."
        >
          {past.length === 0 ? (
            <Card>
              <p className="text-sm text-zinc-400">No settled past payments yet.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {past.map((payment) => (
                <MonthSummaryCard
                  key={payment.id}
                  payment={payment}
                  ratePerSession={ratePerSession}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      )}

      {tab === "future" && (
        <DashboardSection
          title="Upcoming"
          description="Projected earnings based on scheduled trainings. Mark can't attend on a session to reduce the projected amount."
        >
          {future.length === 0 ? (
            <Card>
              <p className="text-sm text-zinc-400">
                No upcoming training months to show.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {(showAllFuture ? future : future.slice(0, 3)).map((payment) => (
                <MonthSummaryCard
                  key={payment.id}
                  payment={payment}
                  ratePerSession={ratePerSession}
                />
              ))}
              {!showAllFuture && future.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllFuture(true)}
                >
                  View more ({future.length - 3} additional)
                </Button>
              )}
              {showAllFuture && future.length > 3 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAllFuture(false)}
                >
                  Show less
                </Button>
              )}
            </div>
          )}
        </DashboardSection>
      )}
    </div>
  );
}
