"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { SpecialOrderProofUpload } from "@/components/special-order/SpecialOrderProofUpload";
import { Card } from "@/components/ui/Card";
import { CONTACT_EMAIL } from "@/lib/contact";
import {
  SPECIAL_ORDER_DUE_LABEL,
  buildSpecialOrderPaymentReference,
  specialOrderFullName,
  specialOrderQuote,
} from "@/lib/special-order-config";
import { specialOrderPaymentStatusLabel } from "@/lib/special-order-payment-access";
import type { SpecialOrderRecord } from "@/lib/special-order-response-config";

export function SpecialOrderPaymentView({
  order,
  clubBank,
}: {
  order: SpecialOrderRecord;
  clubBank: {
    accountHolder: string;
    iban: string;
    accountLabel: string;
  };
}) {
  const quote = specialOrderQuote(order);
  const fullName = specialOrderFullName(order);
  const dueDate = new Date(order.dueDate);
  const now = new Date();
  const beforeDue = now < dueDate;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="py-5">
        <p className="text-sm text-zinc-500">Special order for</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          {fullName}
        </h1>
        <p className="mt-3 inline-flex rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
          {specialOrderPaymentStatusLabel(order.paymentStatus)}
        </p>
      </Card>

      {beforeDue && order.paymentStatus === "AWAITING" ? (
        <Card className="border-amber-500/30 bg-amber-500/[0.08] py-5">
          <h2 className="font-display text-lg font-semibold text-amber-100">
            Payment due {SPECIAL_ORDER_DUE_LABEL}
          </h2>
          <p className="mt-2 text-sm text-amber-100/80">
            You don&apos;t need to pay yet. Feel free to transfer early if that
            is easier — use the details below when you&apos;re ready.
          </p>
        </Card>
      ) : null}

      <Card className="py-5">
        <h2 className="font-display text-lg font-semibold text-white">
          Your order
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Warm-up T-shirt (free) + match quarter zip. Due{" "}
          {SPECIAL_ORDER_DUE_LABEL}.
        </p>
        <KitOrderQuoteBreakdown
          items={quote.items}
          totalEur={quote.totalEur}
          className="mt-4"
        />
      </Card>

      <Card className="border-jackals-red/30 py-5">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-jackals-red-light" />
          <h2 className="font-display text-lg font-semibold text-white">
            Pay by bank transfer
          </h2>
        </div>
        <p className="text-sm text-zinc-400">
          Transfer the total and use the payment reference exactly as shown.
        </p>
        <IbanTransferDetails
          accountHolder={clubBank.accountHolder}
          iban={clubBank.iban}
          accountLabel={clubBank.accountLabel}
          paymentReference={buildSpecialOrderPaymentReference(order)}
          amount={quote.totalEur}
          className="mt-4"
        />
        <SpecialOrderProofUpload
          paymentToken={order.paymentToken}
          existingProofUrl={order.proofScreenshotUrl}
          proofSubmittedAt={order.proofSubmittedAt}
          paymentStatus={order.paymentStatus}
        />
      </Card>

      <p className="text-center text-sm text-zinc-500">
        Questions?{" "}
        <Link
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
            `Special order — ${fullName}`,
          )}`}
          className="text-zinc-300 hover:text-white hover:underline"
        >
          Email the club
        </Link>
      </p>
    </div>
  );
}
