"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { IbanTransferDetails } from "@/components/payments/IbanTransferDetails";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { MerchandiseOrderProofUpload } from "@/components/merchandise-order/MerchandiseOrderProofUpload";
import { Card } from "@/components/ui/Card";
import { CONTACT_EMAIL } from "@/lib/contact";
import { merchandiseOrderPaymentStatusLabel } from "@/lib/merchandise-order-payment-access";
import {
  buildMerchandiseOrderPaymentQuote,
  buildMerchandiseOrderPaymentReference,
} from "@/lib/merchandise-order-payment-summary";
import {
  merchandiseOrderFullName,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";
import { KIT_PAYMENT_DUE } from "@/lib/membership-2026-27";

export function MerchandiseOrderPaymentView({
  order,
  clubBank,
}: {
  order: MerchandiseOrderRecord;
  clubBank: {
    accountHolder: string;
    iban: string;
    accountLabel: string;
  };
}) {
  const quote = buildMerchandiseOrderPaymentQuote(order);
  const fullName = merchandiseOrderFullName(order);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="py-5">
        <p className="text-sm text-zinc-500">Merchandise order for</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">
          {fullName}
        </h1>
        <p className="mt-3 inline-flex rounded-full bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
          {merchandiseOrderPaymentStatusLabel(order.paymentStatus)}
        </p>
      </Card>

      <Card className="py-5">
        <h2 className="font-display text-lg font-semibold text-white">
          Your order
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Payment due {KIT_PAYMENT_DUE}.
        </p>
        <KitOrderQuoteBreakdown
          items={quote.items}
          totalEur={quote.totalEur}
          className="mt-4"
        />
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
            Transfer the total and use the payment reference exactly as shown.
          </p>
          <IbanTransferDetails
            accountHolder={clubBank.accountHolder}
            iban={clubBank.iban}
            accountLabel={clubBank.accountLabel}
            paymentReference={buildMerchandiseOrderPaymentReference(order)}
            amount={quote.totalEur}
            className="mt-4"
          />
          <MerchandiseOrderProofUpload
            paymentToken={order.paymentToken}
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
            The club has covered all items on this order.
          </p>
        </Card>
      )}

      <p className="text-center text-sm text-zinc-500">
        Questions?{" "}
        <Link
          href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
            `Merchandise order — ${fullName}`,
          )}`}
          className="text-zinc-300 hover:text-white hover:underline"
        >
          Email the club
        </Link>
      </p>
    </div>
  );
}
