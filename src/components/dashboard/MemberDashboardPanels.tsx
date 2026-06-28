"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  Swords,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { getEventTypeLabel } from "@/lib/event-filters";
import { formatPaymentScheduleLabel, type PaymentSchedule } from "@/lib/membership-config";
import type { MembershipPaymentAccess } from "@/lib/membership-overdue";
import type { AttendanceBlockReason } from "@/lib/membership";
import {
  getDashboardResponseDisplay,
  itemNeedsUrgentResponse,
  type TrainingAttendanceStatus,
} from "@/lib/training-attendance-config";
import { formatPrice } from "@/lib/utils";

const PREVIEW_LIMIT = 3;

type DashboardEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  type: string;
  location: string | null;
  coach?: string | null;
  trainingSessionId?: string | null;
};

type DashboardUpcomingItem = {
  id: string;
  title: string;
  startDate: string;
  location: string | null;
  userStatus: TrainingAttendanceStatus;
};

function DatePill({ date }: { date: Date }) {
  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center border border-white/10 bg-jackals-surface text-center">
      <span className="text-[10px] font-medium uppercase leading-none text-zinc-500">
        {format(date, "MMM")}
      </span>
      <span className="text-sm font-bold leading-tight text-white">{format(date, "d")}</span>
    </div>
  );
}

function ResponseStatusBadge({
  status,
  eventDate,
}: {
  status: TrainingAttendanceStatus;
  eventDate: Date;
}) {
  const display = getDashboardResponseDisplay(status, eventDate);

  return <Badge className={display.badgeClassName}>{display.label}</Badge>;
}

function CompactEventRow({
  href,
  date,
  title,
  meta,
  status,
  eventDate,
}: {
  href: string;
  date: Date;
  title: string;
  meta: string;
  status?: TrainingAttendanceStatus;
  eventDate?: Date;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
    >
      <DatePill date={date} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-white">{title}</p>
          {status && eventDate && <ResponseStatusBadge status={status} eventDate={eventDate} />}
        </div>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{meta}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
    </Link>
  );
}

function UpcomingList({
  items,
  emptyMessage,
  buildHref,
  buildMeta,
  viewAllHref,
  viewAllLabel,
}: {
  items: DashboardUpcomingItem[];
  emptyMessage: string;
  buildHref: (item: DashboardUpcomingItem) => string;
  buildMeta: (item: DashboardUpcomingItem, date: Date, statusLabel: string) => string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const preview = items.slice(0, PREVIEW_LIMIT);
  const remaining = items.length - preview.length;

  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <StaggerIn className="divide-y divide-white/10" stagger={60}>
      {preview.map((item) => {
        const startDate = new Date(item.startDate);
        const display = getDashboardResponseDisplay(item.userStatus, startDate);
        return (
          <CompactEventRow
            key={item.id}
            href={buildHref(item)}
            date={startDate}
            title={item.title}
            meta={buildMeta(item, startDate, display.label)}
            status={item.userStatus}
            eventDate={startDate}
          />
        );
      })}
      <Link
        href={viewAllHref}
        className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
      >
        {remaining > 0 ? `+${remaining} more · ` : ""}
        {viewAllLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </StaggerIn>
  );
}

export function DashboardUpcomingClubEventsPanel({
  upcomingEvents,
}: {
  upcomingEvents: DashboardEvent[];
}) {
  const clubEvents = upcomingEvents.filter((event) => event.type !== "TRAINING");

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-white">
            Upcoming club events
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Tournaments and socials · within the next 4 weeks</p>
        </div>
        <Link
          href="/events"
          className="shrink-0 text-sm text-jackals-red-light hover:text-jackals-red"
        >
          View all
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="divide-y divide-white/10">
          {clubEvents.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No club events within the next 4 weeks.
            </p>
          ) : (
            <StaggerIn className="divide-y divide-white/10" stagger={60}>
              {clubEvents.slice(0, PREVIEW_LIMIT).map((event) => {
                const startDate = new Date(event.startDate);
                return (
                  <CompactEventRow
                    key={event.id}
                    href={`/calendar/${event.id}`}
                    date={startDate}
                    title={event.title}
                    meta={`${getEventTypeLabel(event.type)} · ${format(startDate, "EEE HH:mm")}${
                      event.location ? ` · ${event.location}` : ""
                    }`}
                  />
                );
              })}
              {clubEvents.length > PREVIEW_LIMIT && (
                <Link
                  href="/events"
                  className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
                >
                  +{clubEvents.length - PREVIEW_LIMIT} more events
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </StaggerIn>
          )}
        </div>
      </Card>
    </section>
  );
}

export function DashboardUpcomingTrainingCard({
  teamName,
  sessions,
  attendanceBlocked = false,
  attendanceBlockReason = null,
}: {
  teamName: string | null;
  sessions: DashboardUpcomingItem[];
  attendanceBlocked?: boolean;
  attendanceBlockReason?: AttendanceBlockReason | null;
}) {
  const needsResponse = sessions.filter((session) =>
    itemNeedsUrgentResponse(session.userStatus, new Date(session.startDate)),
  ).length;

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Upcoming training</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {!teamName
                ? "No training team assigned"
                : needsResponse > 0
                  ? `${needsResponse} session${needsResponse === 1 ? "" : "s"} ${needsResponse === 1 ? "needs" : "need"} your response this week`
                  : `${sessions.length} upcoming session${sessions.length === 1 ? "" : "s"} · within the next 2 weeks`}
            </p>
          </div>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        {attendanceBlocked && attendanceBlockReason === "overdue" && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Training responses are paused until your overdue membership payment is cleared.
            {" "}
            <Link href="/membership" className="font-medium text-white underline-offset-2 hover:underline">
              View payment schedule
            </Link>
          </div>
        )}
        <div className="divide-y divide-white/10">
          {!teamName ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Ask an admin to assign you to a training team.
            </p>
          ) : (
            <UpcomingList
              items={sessions}
              emptyMessage="No training sessions within the next 2 weeks."
              buildHref={(item) => `/training/session/${item.id}`}
              buildMeta={(item, date, statusLabel) =>
                `${format(date, "EEE HH:mm")}${item.location ? ` · ${item.location}` : ""} · ${statusLabel}`
              }
              viewAllHref="/training"
              viewAllLabel="View training schedule"
            />
          )}
        </div>
      </Card>
    </section>
  );
}

export function DashboardUpcomingMatchesCard({
  teamName,
  matches,
  attendanceBlocked = false,
  attendanceBlockReason = null,
}: {
  teamName: string | null;
  matches: DashboardUpcomingItem[];
  attendanceBlocked?: boolean;
  attendanceBlockReason?: AttendanceBlockReason | null;
}) {
  const needsResponse = matches.filter((match) =>
    itemNeedsUrgentResponse(match.userStatus, new Date(match.startDate)),
  ).length;

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
            <Swords className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Upcoming matches</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {!teamName
                ? "No team assigned"
                : needsResponse > 0
                  ? `${needsResponse} match${needsResponse === 1 ? "" : "es"} ${needsResponse === 1 ? "needs" : "need"} your response this week`
                  : `${matches.length} match${matches.length === 1 ? "" : "es"} · within the next 2 weeks`}
            </p>
          </div>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        {attendanceBlocked && attendanceBlockReason === "overdue" && (
          <div className="border-b border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Match responses are paused until your overdue membership payment is cleared.
            {" "}
            <Link href="/membership" className="font-medium text-white underline-offset-2 hover:underline">
              View payment schedule
            </Link>
          </div>
        )}
        <div className="divide-y divide-white/10">
          {!teamName ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Ask an admin to assign you to a team.
            </p>
          ) : (
            <UpcomingList
              items={matches}
              emptyMessage="No matches within the next 2 weeks."
              buildHref={(item) => `/matches/${item.id}`}
              buildMeta={(item, date, statusLabel) =>
                `${format(date, "EEE HH:mm")}${item.location ? ` · ${item.location}` : ""} · ${statusLabel}`
              }
              viewAllHref="/matches"
              viewAllLabel="View match schedule"
            />
          )}
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
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-white">Membership</h2>
        <Link
          href="/membership"
          className="shrink-0 text-sm text-jackals-red-light hover:text-jackals-red"
        >
          {currentMembership ? "View more" : "Choose schedule"}
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex items-start gap-3 px-4 py-4">
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
          href="/membership"
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
