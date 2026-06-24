"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { AlertBanner } from "@/components/ui/FormMessage";
import { Checkbox } from "@/components/ui/InputFields";
import {
  buildInstallments,
  CLUB_MEMBERSHIP_SEASON_LABEL,
  MEMBERSHIP_FEATURES,
  createMembershipPricing,
  formatPaymentScheduleLabel,
  getPaymentScheduleOptions,
  getScheduleDueNowLabel,
  type MembershipPricing,
  type PaymentSchedule,
  type PaymentScheduleOption,
} from "@/lib/membership-config";
import { apiPost } from "@/lib/client-api";
import { useAuthModal } from "@/components/providers/AuthModalProvider";
import { AnimateIn } from "@/components/motion/AnimateIn";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { cn, formatEuroFee } from "@/lib/utils";

export type MembershipPlanCheckout = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
};

type LockedMembership = {
  paymentSchedule: PaymentSchedule;
  endDate: string;
  planName: string;
  price: number;
  durationMonths: number;
};

export function MembershipLockedView({ membership }: { membership: LockedMembership }) {
  const pricing = createMembershipPricing(membership.price, membership.durationMonths);
  const installments = buildInstallments(membership.paymentSchedule, pricing);

  return (
    <AnimateIn immediate>
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
            for your membership. This cannot be changed.
          </CardDescription>
          <p className="mt-2 text-sm text-zinc-400">
            Ends {new Date(membership.endDate).toLocaleDateString("en-GB")}. Pay each
            instalment by bank transfer from your membership page.
          </p>
          <Link
            href="/membership"
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
              {formatEuroFee(installment.amount)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
    </AnimateIn>
  );
}

function MembershipBenefitsPanel({ features }: { features: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        What&apos;s included in the membership?
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
            <Check className="h-3.5 w-3.5 shrink-0 text-jackals-red-light" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlanOptionCard({
  plan,
  selected,
  onSelect,
}: {
  plan: MembershipPlanCheckout;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-xl border p-5 text-left transition-all",
        selected
          ? "border-jackals-red/60 bg-jackals-red/10 shadow-[0_0_24px_rgba(232,34,42,0.12)] ring-1 ring-jackals-red/30"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold text-white">{plan.name}</p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-jackals-red bg-jackals-red text-white"
              : "border-white/20 bg-transparent text-transparent",
          )}
          aria-hidden
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-5">
        <p className="font-display text-3xl font-bold text-white">
          {formatEuroFee(plan.price)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{CLUB_MEMBERSHIP_SEASON_LABEL}</p>
      </div>
    </button>
  );
}

function ScheduleOptionCard({
  option,
  pricing,
  selected,
  onSelect,
}: {
  option: PaymentScheduleOption;
  pricing: MembershipPricing;
  selected: boolean;
  onSelect: () => void;
}) {
  const dueLabel = getScheduleDueNowLabel(option.id, pricing);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex h-full flex-col rounded-xl border p-5 text-left transition-all",
        selected
          ? "border-jackals-red/60 bg-jackals-red/10 shadow-[0_0_24px_rgba(232,34,42,0.12)] ring-1 ring-jackals-red/30"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-white">{option.label}</p>
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-jackals-red bg-jackals-red text-white"
              : "border-white/20 bg-transparent text-transparent",
          )}
          aria-hidden
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{option.description}</p>

      <p className="mt-auto pt-4 text-sm font-medium text-white">{dueLabel}</p>
      <p className="mt-0.5 text-xs text-zinc-500">{option.summary}</p>
    </button>
  );
}

export function MembershipCheckout({ plans }: { plans: MembershipPlanCheckout[] }) {
  const { data: session, status: sessionStatus } = useSession();
  const { openAuth } = useAuthModal();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    plans.length === 1 ? plans[0]!.id : null,
  );
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [confirmedLock, setConfirmedLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);

  const pricing = useMemo(
    () =>
      selectedPlan
        ? createMembershipPricing(selectedPlan.price, selectedPlan.durationMonths)
        : null,
    [selectedPlan],
  );
  const scheduleOptions = useMemo(
    () => (pricing ? getPaymentScheduleOptions(pricing) : []),
    [pricing],
  );

  const previewInstallments = useMemo(
    () =>
      selectedSchedule && pricing ? buildInstallments(selectedSchedule, pricing) : [],
    [pricing, selectedSchedule],
  );
  const seasonTotalPrice = pricing?.seasonTotalPrice ?? 0;

  const subscribe = async () => {
    if (sessionStatus === "loading") return;

    if (!session) {
      openAuth("signin", "/membership");
      return;
    }

    if (!selectedPlan) {
      setMessage("Please choose a membership type first.");
      return;
    }

    if (!selectedSchedule) {
      setMessage("Please choose a payment schedule first.");
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
      { planId: selectedPlan.id, paymentSchedule: selectedSchedule },
      "Failed to create membership",
    );

    setLoading(false);

    if (!result.ok) {
      if (result.error.includes("already set")) {
        window.location.assign("/membership");
        return;
      }
      setMessage(result.error);
      return;
    }

    window.location.assign("/membership");
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
    setSelectedSchedule(null);
    setCheckoutStep(1);
    setConfirmedLock(false);
    setMessage(null);
  };

  const scheduleStep = plans.length > 1 ? 2 : 1;
  const reviewStep = plans.length > 1 ? 3 : 2;

  const handleScheduleSelect = (next: PaymentSchedule) => {
    setSelectedSchedule(next);
    setCheckoutStep(scheduleStep);
    setConfirmedLock(false);
    setMessage(null);
  };

  const handleContinueToReview = () => {
    if (!selectedPlan) {
      setMessage("Please choose a membership type first.");
      return;
    }
    if (!selectedSchedule) {
      setMessage("Please choose a payment schedule first.");
      return;
    }
    setCheckoutStep(reviewStep);
    setConfirmedLock(false);
    setMessage(null);
  };

  const handleBackToPlan = () => {
    setCheckoutStep(1);
    setSelectedSchedule(null);
    setConfirmedLock(false);
    setMessage(null);
  };

  return (
    <StaggerIn className="mx-auto max-w-4xl space-y-8" stagger={100}>
      <AlertBanner message={message} />

      {plans.length > 1 && (
        <section>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-white">
              1. Choose your membership
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Pick the rate that applies to you. Both cover the same season and benefits.
            </p>
          </div>

          <div role="radiogroup" aria-label="Membership type">
            <StaggerIn className="grid gap-4 md:grid-cols-2" stagger={80}>
              {plans.map((plan) => (
                <PlanOptionCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlanId === plan.id}
                  onSelect={() => handlePlanSelect(plan.id)}
                />
              ))}
            </StaggerIn>
          </div>

          <div className="mt-5">
            <MembershipBenefitsPanel features={MEMBERSHIP_FEATURES} />
          </div>

          {selectedPlan && checkoutStep === 1 && (
            <Button className="mt-6 w-full sm:w-auto" onClick={() => setCheckoutStep(2)}>
              Continue with {selectedPlan.name.toLowerCase()}
            </Button>
          )}
        </section>
      )}

      {plans.length === 1 && selectedPlan && (
        <Card className="overflow-hidden border-jackals-red/25 p-0">
          <div className="border-b border-jackals-red/20 bg-jackals-red/5 px-6 py-5 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
              {selectedPlan.name}
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                {formatEuroFee(selectedPlan.price)}
              </span>
              <span className="pb-1 text-sm text-zinc-400">{CLUB_MEMBERSHIP_SEASON_LABEL}</span>
            </div>
          </div>
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2 sm:px-8">
            {MEMBERSHIP_FEATURES.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="h-4 w-4 shrink-0 text-jackals-red-light" />
                {feature}
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedPlan && checkoutStep >= scheduleStep && (
      <section>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              {scheduleStep}. Choose your payment schedule
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {selectedPlan.name} · {formatEuroFee(selectedPlan.price)} — monthly, three
              instalments, or pay in full. You cannot change this later.
            </p>
          </div>
          {plans.length > 1 && (
            <button
              type="button"
              onClick={handleBackToPlan}
              className="text-sm text-jackals-red-light transition-colors hover:text-jackals-red"
            >
              Change membership type
            </button>
          )}
        </div>

        <div role="radiogroup" aria-label="Payment schedule">
          <StaggerIn className="grid gap-4 md:grid-cols-3" stagger={80}>
            {scheduleOptions.map((option) => (
              <ScheduleOptionCard
                key={option.id}
                option={option}
                pricing={pricing!}
                selected={selectedSchedule === option.id}
                onSelect={() => handleScheduleSelect(option.id)}
              />
            ))}
          </StaggerIn>
        </div>

        {selectedSchedule && checkoutStep === scheduleStep && (
          <Button className="mt-6 w-full sm:w-auto" onClick={handleContinueToReview}>
            Continue with {formatPaymentScheduleLabel(selectedSchedule).toLowerCase()}
          </Button>
        )}
      </section>
      )}

      {selectedPlan && selectedSchedule && checkoutStep === reviewStep && pricing && (
        <AnimateIn immediate>
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              {reviewStep}. Review & confirm
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {selectedPlan.name} · {formatPaymentScheduleLabel(selectedSchedule)} — pay by SEPA
              bank transfer to our SumUp Business Account.
            </p>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4 sm:px-6">
              <p className="text-sm font-medium text-white">
                {formatPaymentScheduleLabel(selectedSchedule)} schedule
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Total cost {formatEuroFee(seasonTotalPrice)}
              </p>
            </div>

            <ul className="divide-y divide-white/10">
              {previewInstallments.map((installment, index) => (
                <li
                  key={installment.installmentNumber}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">
                      {index === 0 ? "Due now" : format(installment.dueDate, "d MMM yyyy")}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{installment.description}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-jackals-red-light">
                    {formatEuroFee(installment.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="border-jackals-red/20 bg-jackals-red/[0.04] p-5 sm:p-6">
            {message && (
              <p className="mb-4 text-sm text-jackals-red-light">{message}</p>
            )}
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={confirmedLock}
                onChange={(event) => setConfirmedLock(event.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed text-zinc-300">
                I understand this payment schedule is <strong className="text-white">final</strong>{" "}
                and cannot be changed after I confirm.
              </span>
            </label>

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={loading || !confirmedLock || sessionStatus === "loading"}
              onClick={subscribe}
            >
              {loading
                ? "Setting up..."
                : `Confirm ${formatPaymentScheduleLabel(selectedSchedule).toLowerCase()} schedule`}
            </Button>
          </Card>
        </section>
        </AnimateIn>
      )}
    </StaggerIn>
  );
}
