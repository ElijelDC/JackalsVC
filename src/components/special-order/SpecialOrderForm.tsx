"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Gift, Shirt } from "lucide-react";
import { KitSizeGuide } from "@/components/kit-order/KitSizeGuide";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormErrorAlert, useFormErrorFocus } from "@/components/ui/FormMessage";
import { Input, Label, Select } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";
import { emailTypoError } from "@/lib/email-typo";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import {
  SPECIAL_ORDER_DUE_LABEL,
  SPECIAL_ORDER_QUARTER_ZIP,
  SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR,
  SPECIAL_ORDER_SIZES,
  SPECIAL_ORDER_TOTAL_EUR,
  SPECIAL_ORDER_TSHIRT,
  specialOrderItemSummary,
} from "@/lib/special-order-config";
import {
  specialOrderPaymentPath,
  specialOrderPaymentStatusLabel,
} from "@/lib/special-order-payment-access";
import type { SpecialOrderRecord } from "@/lib/special-order-response-config";
import { cn } from "@/lib/utils";

type Fields = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  tshirtSize: string;
  quarterZipSize: string;
};

function SpecialOrderSavedCard({
  order,
  title = "Order received",
}: {
  order: SpecialOrderRecord;
  title?: string;
}) {
  const paymentUrl = specialOrderPaymentPath(order.paymentToken);
  return (
    <Card className="mx-auto max-w-lg border-emerald-500/30 bg-emerald-500/[0.06] p-6 sm:p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
        <Check className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold text-white">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300">
        Your warm-up T-shirt and match quarter zip are reserved.{" "}
        <span className="font-medium text-white">
          Nothing is due until {SPECIAL_ORDER_DUE_LABEL}
        </span>{" "}
        — total {formatMembershipEuro(SPECIAL_ORDER_TOTAL_EUR)}.
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-zinc-300">
        {specialOrderItemSummary(order).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500">
        Payment status: {specialOrderPaymentStatusLabel(order.paymentStatus)}.
        This package can only be ordered once.
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        We&apos;ll email payment details closer to November. You can pay early
        anytime if you prefer.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={paymentUrl}
          className="inline-flex items-center justify-center gap-2 bg-jackals-red px-6 py-3 text-base font-semibold text-white clip-slash transition-all hover:bg-jackals-red-hover"
        >
          View payment details
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 border border-white/20 px-6 py-3 text-base font-semibold text-white transition-all hover:border-jackals-red/50 hover:bg-jackals-red/10"
        >
          Back to dashboard
        </Link>
      </div>
    </Card>
  );
}

export function SpecialOrderForm({
  initialName = "",
  initialEmail = "",
  existingOrder = null,
}: {
  initialName?: string;
  initialEmail?: string;
  existingOrder?: SpecialOrderRecord | null;
}) {
  const nameParts = initialName.trim().split(/\s+/).filter(Boolean);
  const [fields, setFields] = useState<Fields>({
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: initialEmail,
    phoneNumber: "",
    tshirtSize: "",
    quarterZipSize: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedOrder, setSavedOrder] = useState<SpecialOrderRecord | null>(
    existingOrder,
  );
  const errorRef = useRef<HTMLDivElement>(null);
  useFormErrorFocus(error, errorRef);

  const set =
    (key: keyof Fields) =>
    (value: string) =>
      setFields((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setError(null);
    if (!fields.tshirtSize) {
      setError("Select a size for the warm-up T-shirt.");
      return;
    }
    if (!fields.quarterZipSize) {
      setError("Select a size for the match quarter zip.");
      return;
    }
    const typo = emailTypoError(fields.email);
    if (typo) {
      setError(typo);
      return;
    }
    setLoading(true);
    const result = await apiPost<{
      success: boolean;
      paymentUrl: string;
      message: string;
      order: SpecialOrderRecord;
    }>("/api/special-order", fields, "Could not submit special order");
    setLoading(false);
    if (!result.ok) {
      if (/already/i.test(result.error)) {
        window.location.reload();
        return;
      }
      setError(result.error);
      return;
    }
    setSavedOrder(result.data.order);
  };

  if (savedOrder) {
    return (
      <SpecialOrderSavedCard
        order={savedOrder}
        title={existingOrder ? "Your special order" : "Order received"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-jackals-red/25 bg-gradient-to-br from-jackals-red/10 via-jackals-surface to-jackals-surface p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-jackals-red-light">
          Special order
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
          Warm-up tee + match quarter zip
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Both items are included. The T-shirt is free; the quarter zip is{" "}
          {formatMembershipEuro(SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR)}. Pay when
          it suits you —{" "}
          <span className="text-zinc-200">due {SPECIAL_ORDER_DUE_LABEL}</span>.
          You can only place this order once.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
            <Gift className="h-3.5 w-3.5" />
            T-shirt free
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
            <Shirt className="h-3.5 w-3.5" />
            Quarter zip {formatMembershipEuro(SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR)}
          </span>
          <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-100">
            Due {SPECIAL_ORDER_DUE_LABEL}
          </span>
          <span className="inline-flex rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-medium text-zinc-300">
            One order only
          </span>
        </div>
      </Card>

      <FormErrorAlert ref={errorRef} message={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          {
            item: SPECIAL_ORDER_TSHIRT,
            size: fields.tshirtSize,
            setSize: set("tshirtSize"),
            sizeId: "special-tshirt-size",
            guide: <KitSizeGuide kind="tshirt" />,
            priceLabel: "Free",
            priceClass: "text-emerald-300",
          },
          {
            item: SPECIAL_ORDER_QUARTER_ZIP,
            size: fields.quarterZipSize,
            setSize: set("quarterZipSize"),
            sizeId: "special-quarter-zip-size",
            guide: <KitSizeGuide kind="jacket" />,
            priceLabel: formatMembershipEuro(SPECIAL_ORDER_QUARTER_ZIP_FEE_EUR),
            priceClass: "text-white",
          },
        ].map(({ item, size, setSize, sizeId, guide, priceLabel, priceClass }) => (
          <Card key={item.id} className="overflow-hidden p-0">
            <div
              className={cn(
                "relative w-full bg-white",
                item.imageAspectClass,
              )}
            >
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                priority
                className="object-contain object-center"
                sizes="(max-width: 1024px) 100vw, 480px"
              />
            </div>
            <div className="space-y-3 border-t border-white/10 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-sm text-zinc-500">{item.subtitle}</p>
                </div>
                <p className={cn("shrink-0 text-sm font-semibold", priceClass)}>
                  {priceLabel}
                </p>
              </div>
              <div>{guide}</div>
              <div>
                <Label htmlFor={sizeId}>Size</Label>
                <Select
                  id={sizeId}
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  className="mt-1.5"
                >
                  <option value="">Choose size</option>
                  {SPECIAL_ORDER_SIZES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 p-5 sm:p-6">
        <h3 className="font-display text-lg font-semibold text-white">
          Your details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="special-first-name">First name</Label>
            <Input
              id="special-first-name"
              value={fields.firstName}
              onChange={(event) => set("firstName")(event.target.value)}
              className="mt-1.5"
              autoComplete="given-name"
            />
          </div>
          <div>
            <Label htmlFor="special-last-name">Last name</Label>
            <Input
              id="special-last-name"
              value={fields.lastName}
              onChange={(event) => set("lastName")(event.target.value)}
              className="mt-1.5"
              autoComplete="family-name"
            />
          </div>
          <div>
            <Label htmlFor="special-email">Email</Label>
            <Input
              id="special-email"
              type="email"
              value={fields.email}
              onChange={(event) => set("email")(event.target.value)}
              className="mt-1.5"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="special-phone">Phone number</Label>
            <Input
              id="special-phone"
              type="tel"
              value={fields.phoneNumber}
              onChange={(event) => set("phoneNumber")(event.target.value)}
              className="mt-1.5"
              autoComplete="tel"
            />
          </div>
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-xl border border-jackals-red/30 bg-jackals-surface/95 px-3 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur sm:px-4 sm:py-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-white sm:text-lg">
            {formatMembershipEuro(SPECIAL_ORDER_TOTAL_EUR)}
            <span className="ml-1.5 text-sm font-normal text-zinc-400">
              · due {SPECIAL_ORDER_DUE_LABEL.replace(/ 20\d{2}$/, "")}
            </span>
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={loading}
          onClick={() => void submit()}
          className="shrink-0"
        >
          {loading ? "Submitting…" : "Place order"}
        </Button>
      </div>
    </div>
  );
}
