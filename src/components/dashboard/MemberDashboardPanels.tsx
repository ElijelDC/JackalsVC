"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, CreditCard, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { DashboardEventRow } from "@/components/dashboard/DashboardScheduleRow";
import { DASHBOARD_SCHEDULE_PREVIEW_LIMIT } from "@/lib/dashboard-schedule-config";
import type { DashboardClubEvent } from "@/components/dashboard/dashboard-types";
import { getEventTypeLabel } from "@/lib/event-filters";
import { formatPaymentScheduleLabel, type PaymentSchedule } from "@/lib/membership-config";
import type { MembershipPaymentAccess } from "@/lib/membership-overdue";
import { formatPrice } from "@/lib/utils";
import { withDashboardReturn } from "@/lib/dashboard-return";

export {
  CoachUpcomingMatchesCard,
  CoachUpcomingTrainingCard,
  DashboardUpcomingMatchesCard,
  DashboardUpcomingTrainingCard,
} from "@/components/dashboard/DashboardUpcomingScheduleSections";

export function DashboardUpcomingClubEventsPanel({
  upcomingEvents,
}: {
  upcomingEvents: DashboardClubEvent[];
}) {
  const clubEvents = upcomingEvents.filter((event) => event.type !== "TRAINING");

  return (
    <section className="@container/dash-tile flex h-full w-full min-w-0 flex-col">
      <div className="mb-2.5 sm:mb-4">
        <h2 className="font-display text-base font-semibold text-white sm:text-xl">
          <span className="inline-flex items-center gap-1.5 sm:gap-2">
            <PartyPopper className="h-4 w-4 shrink-0 text-jackals-red-light sm:h-5 sm:w-5" />
            <span className="@[16rem]/dash-tile:hidden">Events</span>
            <span className="hidden @[16rem]/dash-tile:inline">Upcoming club events</span>
          </span>
        </h2>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-500 sm:text-xs">
          <span className="sm:hidden">Next 4 weeks</span>
          <span className="hidden sm:inline">
            Tournaments and socials · within the next 4 weeks
          </span>
        </p>
      </div>

      <Card className="flex min-w-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col divide-y divide-white/10">
          {clubEvents.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-2.5 py-4 text-center text-[11px] leading-snug text-zinc-500 sm:px-5 sm:py-5 sm:text-sm">
              No club events in the next 4 weeks
            </p>
          ) : (
            <StaggerIn className="divide-y divide-white/10" stagger={60}>
              {clubEvents.slice(0, DASHBOARD_SCHEDULE_PREVIEW_LIMIT).map((event) => {
                const startDate = new Date(event.startDate);
                return (
                  <DashboardEventRow
                    key={event.id}
                    href={withDashboardReturn(`/calendar/${event.id}`)}
                    date={startDate}
                    title={event.title}
                    meta={`${getEventTypeLabel(event.type)} · ${format(startDate, "EEE HH:mm")}${
                      event.location ? ` · ${event.location}` : ""
                    }`}
                    dense
                  />
                );
              })}
            </StaggerIn>
          )}
          <Link
            href={withDashboardReturn("/events")}
            className="mt-auto flex items-center justify-center gap-1 border-t border-white/10 py-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light sm:py-2.5 sm:text-xs"
          >
            {clubEvents.length > DASHBOARD_SCHEDULE_PREVIEW_LIMIT
              ? `+${clubEvents.length - DASHBOARD_SCHEDULE_PREVIEW_LIMIT} more · `
              : ""}
            View all
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        </div>
      </Card>
    </section>
  );
}

type PaymentRecord = {
  id: string;
  amount: number;
  status: string;
  installmentNumber: number | null;
  dueDate: string | null;
};

type MembershipRecord = {
  id: string;
  status: string;
  paymentSchedule: PaymentSchedule;
  paymentOverdueOverride: boolean;
  startDate: string;
  endDate: string;
  plan: { name: string; price: number };
};

type MemberPaymentsPanelProps = {
  memberships: MembershipRecord[];
  payments: PaymentRecord[];
  paymentAccess: MembershipPaymentAccess | null;
};

export function MemberPaymentsPanel({
  memberships,
  payments,
  paymentAccess,
}: MemberPaymentsPanelProps) {
  const currentMembership = memberships.find((m) => new Date(m.endDate) > new Date());
  const activeMembership =
    currentMembership?.status === "ACTIVE" ? currentMembership : undefined;
  const pendingMembership =
    currentMembership?.status === "PENDING_PAYMENT" ? currentMembership : undefined;

  const completedPayments = payments.filter((payment) => payment.status === "COMPLETED");
  const pendingPayments = payments.filter((payment) => payment.status === "PENDING");
  const nextPayment = pendingPayments[0];
  const completedTotal = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const seasonTotal = currentMembership?.plan.price ?? payments.reduce((sum, p) => sum + p.amount, 0);
  const paymentProgress =
    payments.length > 0 ? Math.round((completedPayments.length / payments.length) * 100) : 0;
  const schedule = currentMembership?.paymentSchedule;
  const instalmentLabel = schedule === "MONTHLY" ? "months" : "instalments";

  return (
    <section className="min-w-0">
      <div className="mb-2.5 flex items-center justify-between gap-4 sm:mb-4">
        <h2 className="font-display text-base font-semibold text-white sm:text-xl">
          Membership
        </h2>
        <Link
          href={withDashboardReturn("/membership")}
          className="shrink-0 text-sm text-jackals-red-light hover:text-jackals-red"
        >
          {currentMembership ? "View more" : "Choose schedule"}
        </Link>
      </div>

      <Card className="min-w-0 overflow-hidden p-0">
        <div className="flex items-start gap-3 px-4 py-3 sm:py-4">
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-jackals-red-light" />
          <div className="min-w-0 flex-1">
            {currentMembership ? (
              <>
                <p className="font-medium text-white">
                  {paymentAccess?.isOverdue ? (
                    <span className="text-red-400">Overdue</span>
                  ) : paymentAccess?.isPastDue ? (
                    <span className="text-amber-400">Payment due</span>
                  ) : activeMembership ? (
                    <span className="text-green-400">Active</span>
                  ) : (
                    <span className="text-amber-400">Awaiting first payment</span>
                  )}{" "}
                  — {currentMembership.plan.name}
                  {paymentAccess?.hasOverride && (
                    <Badge className="ml-2 border-blue-500/30 bg-blue-500/10 text-blue-300">
                      Admin override
                    </Badge>
                  )}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatPaymentScheduleLabel(currentMembership.paymentSchedule)} ·{" "}
                  {format(new Date(currentMembership.startDate), "d MMM yyyy")} –{" "}
                  {format(new Date(currentMembership.endDate), "d MMM yyyy")}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatPrice(completedTotal, "EUR")} paid
                  {seasonTotal > 0 && ` of ${formatPrice(seasonTotal, "EUR")}`}
                </p>
                {payments.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-1.5 flex justify-between text-xs text-zinc-500">
                      <span>Progress</span>
                      <span>
                        {completedPayments.length} of {payments.length} {instalmentLabel}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-green-500/80 transition-all"
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {nextPayment && (
                  <p className="mt-3 text-sm text-zinc-400">
                    Next:{" "}
                    <span className="font-medium text-white">
                      {formatPrice(nextPayment.amount, "EUR")}
                    </span>
                    {nextPayment.dueDate && (
                      <span className="text-zinc-500">
                        {" "}
                        due {format(new Date(nextPayment.dueDate), "d MMM yyyy")}
                      </span>
                    )}
                  </p>
                )}
                {paymentAccess?.isOverdue && (
                  <p className="mt-2 text-sm text-red-300/90">
                    Training and match sign-ups are paused until this payment is received.
                  </p>
                )}
                {paymentAccess?.isPastDue &&
                  !paymentAccess.isOverdue &&
                  paymentAccess.graceDaysRemaining !== null && (
                    <p className="mt-2 text-sm text-amber-300/90">
                      Payment is past due. Pay within {paymentAccess.graceDaysRemaining} day
                      {paymentAccess.graceDaysRemaining === 1 ? "" : "s"} to keep training and
                      match access.
                    </p>
                  )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                No membership yet. Choose a payment schedule to get started.
              </p>
            )}
          </div>
        </div>

        <Link
          href={withDashboardReturn("/membership")}
          className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
        >
          {currentMembership
            ? pendingMembership
              ? "Pay membership & upload proof"
              : "View membership & payment schedule"
            : "Set up membership"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </section>
  );
}
