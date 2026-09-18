"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import {
  MEMBERSHIP_FIRST_PAYMENT_DUE_LABEL,
  MEMBERSHIP_FIRST_PAYMENT_DUE_SHORT,
} from "@/lib/membership-config";
import { cn } from "@/lib/utils";

export function MembershipDueNotice({
  variant = "page",
  isPaygPlayer = false,
  className,
}: {
  variant?: "page" | "compact";
  isPaygPlayer?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-amber-500/30 bg-amber-500/10 text-amber-50",
        variant === "page" ? "rounded-xl px-4 py-4 sm:px-5" : "rounded-lg px-3 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <CalendarClock
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
          aria-hidden
        />
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-amber-100">
            Membership due {MEMBERSHIP_FIRST_PAYMENT_DUE_SHORT}
          </p>
          <p className="text-sm leading-relaxed text-amber-50/85">
            Season membership payments are due{" "}
            <span className="font-medium text-white">
              {MEMBERSHIP_FIRST_PAYMENT_DUE_LABEL}
            </span>
            .
            {isPaygPlayer
              ? " Until then you can keep attending training pay-per-session. From that date, squad training is membership-only (guest invite links still work)."
              : " Choose a plan below to lock in your payment schedule."}
          </p>
          {variant === "compact" ? (
            <Link
              href="/membership"
              className="inline-flex text-sm font-medium text-jackals-red-light hover:text-jackals-red"
            >
              Set up membership
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
