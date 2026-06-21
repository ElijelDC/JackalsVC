"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/FormMessage";
import {
  buildInstallments,
  formatPaymentScheduleLabel,
  MEMBERSHIP_FEATURES,
  PAYMENT_SCHEDULE_OPTIONS,
  SEASON_DURATION_MONTHS,
  SEASON_TOTAL_PRICE,
  type PaymentSchedule,
} from "@/lib/membership-config";
import { apiPost } from "@/lib/client-api";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import { cn, formatPrice } from "@/lib/utils";

type LockedMembership = {
  paymentSchedule: PaymentSchedule;
  endDate: string;
  planName: string;
};

export function MembershipLockedView({ membership }: { membership: LockedMembership }) {
  const installments = buildInstallments(membership.paymentSchedule);

  return (
    <Card className="border-jackals-red/30">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-jackals-red-light" />
        <div>
          <CardTitle className="text-lg">Your payment schedule is set</CardTitle>
          <CardDescription className="mt-2">
            You chose{" "}
            <span className="text-white">
              {formatPaymentScheduleLabel(membership.paymentSchedule)}
            </span>{" "}
            for this season. This cannot be changed.
          </CardDescription>
          <p className="mt-2 text-sm text-zinc-400">
            Season ends {new Date(membership.endDate).toLocaleDateString("en-GB")}. Pay each
            instalment by bank transfer from your payment status page.
          </p>
          <Link
            href="/membership/payments"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-jackals-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-jackals-red-hover clip-slash"
          >
            View payment status
          </Link>
        </div>
      </div>

      <ul className="mt-6 space-y-2 border-t border-white/10 pt-4">
        {installments.map((installment) => (
          <li
            key={installment.installmentNumber}
            className="flex items-center justify-between text-sm text-zinc-300"
          >
            <span>{installment.description}</span>
            <span className="font-medium text-white">
              {formatPrice(installment.amount, "EUR")}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function MembershipCheckout() {
  const { data: session } = useSession();
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule>("FULL");
  const [confirmedLock, setConfirmedLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedInstallments = buildInstallments(selectedSchedule);

  const subscribe = async () => {
    if (!session) {
      openAuth("signin", "/membership");
      return;
    }

    if (!confirmedLock) {
      setMessage("Please confirm that you understand this payment schedule cannot be changed.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await apiPost(
      "/api/membership",
      { paymentSchedule: selectedSchedule },
      "Failed to create membership",
    );

    setLoading(false);

    if (!result.ok) {
      if (result.error.includes("already set")) {
        router.push("/membership/payments");
        return;
      }
      setMessage(result.error);
      return;
    }

    router.push("/membership/payments");
    router.refresh();
  };

  return (
    <>
      <AlertBanner message={message} />

      <Card className="mb-8 border-jackals-red/30 ring-1 ring-jackals-red/20">
        <CardTitle>Jackals VC Season Membership</CardTitle>
        <CardDescription className="mt-2">
          One membership for every club member — {SEASON_DURATION_MONTHS} months of training,
          tournaments, and member benefits.
        </CardDescription>

        <div className="my-6">
          <span className="text-4xl font-bold text-white">
            {formatPrice(SEASON_TOTAL_PRICE, "EUR")}
          </span>
          <span className="text-zinc-500"> / {SEASON_DURATION_MONTHS}-month season</span>
        </div>

        <ul className="grid gap-2 sm:grid-cols-2">
          {MEMBERSHIP_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-zinc-300">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-jackals-red-light" />
              {feature}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mb-8">
        <h2 className="font-display mb-2 text-lg font-semibold text-white">
          Choose how you pay
        </h2>
        <p className="text-sm text-zinc-400">
          All options total {formatPrice(SEASON_TOTAL_PRICE, "EUR")}. Pay by SEPA transfer to our
          SumUp Business Account IBAN — no payment links. Your choice is locked once confirmed.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PAYMENT_SCHEDULE_OPTIONS.map((option) => {
          const installments = buildInstallments(option.id);
          const isSelected = selectedSchedule === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedSchedule(option.id)}
              className={cn(
                "rounded-lg border p-5 text-left transition-colors",
                isSelected
                  ? "border-jackals-red/50 bg-jackals-red/10 ring-1 ring-jackals-red/30"
                  : "border-white/10 bg-zinc-900/50 hover:border-white/20",
              )}
            >
              <p className="font-semibold text-white">{option.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{option.description}</p>
              <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                {option.summary}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-zinc-300">
                {installments.map((installment) => (
                  <li key={installment.installmentNumber}>
                    {installment.description}:{" "}
                    <span className="font-medium text-white">
                      {formatPrice(installment.amount, "EUR")}
                    </span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardTitle className="text-base">Your payment schedule</CardTitle>
        <CardDescription className="mt-1">
          After confirming, you&apos;ll get your SumUp Business Account IBAN and a unique reference
          for each payment on your dashboard. We match incoming SEPA transfers automatically.
        </CardDescription>
        <ul className="mt-4 space-y-2">
          {selectedInstallments.map((installment, index) => (
            <li
              key={installment.installmentNumber}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-zinc-400">
                {index === 0 ? "Due now" : installment.dueDate.toLocaleDateString("en-GB")} ·{" "}
                {installment.description}
              </span>
              <span className="font-medium text-white">
                {formatPrice(installment.amount, "EUR")}
              </span>
            </li>
          ))}
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
          <input
            type="checkbox"
            checked={confirmedLock}
            onChange={(e) => setConfirmedLock(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-zinc-300">
            I understand this payment schedule is final and cannot be changed later.
          </span>
        </label>

        <Button className="mt-4 w-full" disabled={loading || !confirmedLock} onClick={subscribe}>
          {loading ? "Setting up..." : "Confirm payment schedule"}
        </Button>
      </Card>
    </>
  );
}
