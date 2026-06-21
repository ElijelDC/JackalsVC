"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";

type IbanTransferDetailsProps = {
  accountHolder: string;
  iban: string;
  accountLabel?: string;
  paymentReference: string;
  amount: number;
  className?: string;
};

function CopyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-black/30 px-2 py-1.5 text-sm text-white">
          {value}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function IbanTransferDetails({
  accountHolder,
  iban,
  accountLabel = "SumUp Business Account",
  paymentReference,
  amount,
  className,
}: IbanTransferDetailsProps) {
  return (
    <div className={cn("space-y-3 rounded-lg border border-white/10 bg-black/20 p-4", className)}>
      <p className="text-sm text-zinc-300">
        Pay <span className="font-semibold text-white">{formatPrice(amount, "EUR")}</span> by bank
        transfer. Copy the IBAN and reference below into your banking app.
      </p>
      <CopyField label="Account name" value={accountHolder} />
      <CopyField label="IBAN" value={iban} hint={accountLabel} />
      <CopyField
        label="Payment reference"
        value={paymentReference}
        hint="Your name and the due date — paste this into the reference / description field"
      />
    </div>
  );
}
