"use client";

import Link from "next/link";
import {
  ChevronRight,
  Dumbbell,
  GraduationCap,
  Trophy,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { CoachPaymentItem } from "@/components/coach/CoachPaymentsOverview";
import {
  COACH_PAYMENT_STATUS_LABELS,
  coachCanViewPaymentConfirmation,
  formatCoachPaymentBreakdownSummary,
  formatCoachPaymentMonth,
} from "@/lib/coach-payments-config";
import { formatEuroFee } from "@/lib/utils";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: CoachPaymentItem["status"]) {
  return status === "PAID"
    ? "border-green-500/40 bg-green-500/15 text-green-300"
    : "border-amber-500/40 bg-amber-500/15 text-amber-200";
}

export function CoachDashboardPaymentsPanel({
  currentPayment,
  ratePerSession,
  teamName,
}: {
  currentPayment: CoachPaymentItem | null;
  ratePerSession: number;
  teamName: string;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-white">Payments</h2>
      </div>

      <Card className="overflow-hidden border-jackals-red/15 bg-gradient-to-br from-jackals-red/[0.06] to-transparent p-0">
        <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-jackals-red/15 text-jackals-red-light clip-slash-reverse">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            {currentPayment ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-2xl font-bold text-white">
                    {formatEuroFee(currentPayment.amount)}
                  </p>
                  <Badge className={statusBadgeClass(currentPayment.status)}>
                    {COACH_PAYMENT_STATUS_LABELS[currentPayment.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {formatCoachPaymentMonth(currentPayment.year, currentPayment.month)} ·{" "}
                  {teamName}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {formatCoachPaymentBreakdownSummary(
                    currentPayment.breakdown,
                    formatEuroFee(ratePerSession),
                  )}
                </p>
                {coachCanViewPaymentConfirmation(currentPayment) && (
                  <p className="mt-2 text-xs text-green-400/90">
                    Payment confirmation uploaded by the club
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                No payment record for this month yet.
              </p>
            )}
          </div>
        </div>

        <Link
          href="/payments"
          className="flex items-center justify-center gap-1 border-t border-white/10 py-2.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-white/[0.03] hover:text-jackals-red-light"
        >
          View payments & confirmation screenshots
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </Card>
    </section>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/coach/training",
    label: "Training times",
    description: "Update weekly schedule",
    icon: Dumbbell,
  },
  {
    href: "/coach/matches",
    label: "Matches",
    description: "Add or edit fixtures",
    icon: Trophy,
  },
  {
    href: "/coach/clinics",
    label: "Skills clinics",
    description: "Schedule open sessions",
    icon: GraduationCap,
  },
] as const;

export function CoachDashboardQuickActions() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-white">
          Squad management
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Training, fixtures, and clinics for your team
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-jackals-red/25 hover:bg-jackals-red/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-jackals-red/10 text-jackals-red-light clip-slash-reverse transition-colors group-hover:bg-jackals-red/20">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
            </div>
            <ChevronRight
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition-colors",
                "group-hover:text-jackals-red-light",
              )}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
