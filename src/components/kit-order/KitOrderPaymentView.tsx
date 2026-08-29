"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/contact";
import { KitOrderProofUpload } from "@/components/kit-order/KitOrderProofUpload";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { Card } from "@/components/ui/Card";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import {
  buildKitOrderPaymentQuote,
  buildKitOrderPaymentReference,
} from "@/lib/kit-order-payment-summary";
import { kitOrderPaymentStatusLabel } from "@/lib/kit-order-payment-access";
import {
  jerseyBackName,
  kitOrderGenderLabel,
} from "@/lib/kit-order-config";
import {
  kitOrderFullName,
  kitOrderMerchSummary,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";
import { KIT_PAYMENT_DUE } from "@/lib/membership-2026-27";

export function KitOrderPaymentView({
  order,
  clubBank,
}: {
  order: KitOrderRecord;
  clubBank: {
    accountHolder: string;
    iban: string;
    accountLabel: string;
  };
}) {
  const quote = buildKitOrderPaymentQuote(order);
  const reference = buildKitOrderPaymentReference(order);
  const merch = kitOrderMerchSummary(order);
  const fullName = kitOrderFullName(order);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="py-5">
        <p className="text-sm text-zinc-500">Kit order for</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          {fullName}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {kitOrderGenderLabel(order.gender)} ·{" "}
          {order.kitPiecesLabel || order.kitTypeLabel} · Jersey{" "}
          {jerseyBackName(order.lastName)}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/10">
          {kitOrderPaymentStatusLabel(order.paymentStatus ?? "AWAITING")}
        </p>
      </Card>

      <Card className="py-5">
        <h2 className="font-display text-lg font-semibold text-white">
          Your order
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Everything included in this kit order. Payment due {KIT_PAYMENT_DUE}.
        </p>
        <div className="mt-4">
          <KitOrderQuoteBreakdown items={quote.items} totalEur={quote.totalEur} />
        </div>
        {merch.length > 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            Extras: {merch.join(" · ")}
          </p>
        ) : null}
      </Card>

      {quote.totalEur > 0 ? (
        <Card className="border-jackals-red/30 py-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-jackals-red-light" />
            <h2 className="font-display text-lg font-semibold text-white">
              Pay by bank transfer
            </h2>
          </div>
          <p className="text-sm text-zinc-400">
            Transfer the total below to the club account. Use your name and the
            reference exactly as shown — then upload your receipt underneath.
          </p>

          <IbanTransferDetails
            accountHolder={clubBank.accountHolder}
            iban={clubBank.iban}
            accountLabel={clubBank.accountLabel}
            paymentReference={reference}
            amount={quote.totalEur}
            className="mt-4"
          />

          <p className="mt-4 text-sm text-zinc-400">
            Order email on file:{" "}
            <span className="font-medium text-white">{order.email}</span>
          </p>

          <KitOrderProofUpload
            paymentToken={order.paymentToken!}
            existingProofUrl={order.proofScreenshotUrl}
            proofSubmittedAt={order.proofSubmittedAt}
            paymentStatus={order.paymentStatus}
          />
        </Card>
      ) : (
        <Card className="border-emerald-500/30 py-5">
          <h2 className="font-display text-lg font-semibold text-white">
            No payment due
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            The club has covered the chargeable items on this order. Nothing to
            transfer.
          </p>
        </Card>
      )}

      <p className="text-center text-sm text-zinc-500">
        Questions?{" "}
        <Link
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Kit order — ${fullName}`)}`}
          className="text-zinc-300 underline-offset-2 hover:text-white hover:underline"
        >
          Email the club
        </Link>
      </p>
    </div>
  );
}
