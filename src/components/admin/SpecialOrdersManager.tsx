"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { AdminReceiptPreview } from "@/components/admin/AdminReceiptPreview";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPost } from "@/lib/client-api";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import {
  SPECIAL_ORDER_DUE_LABEL,
  SPECIAL_ORDER_TOTAL_EUR,
  specialOrderFullName,
  specialOrderItemSummary,
  specialOrderQuote,
} from "@/lib/special-order-config";
import {
  specialOrderHasUploadedProof,
  specialOrderPaymentPath,
  specialOrderPaymentStatusLabel,
  specialOrderProofImageUrl,
} from "@/lib/special-order-payment-access";
import type { SpecialOrderRecord } from "@/lib/special-order-response-config";
import { cn } from "@/lib/utils";

type PaymentFilter = "ALL" | "RECEIPTS" | "PAID" | "UNPAID";

function proofUrl(order: SpecialOrderRecord) {
  if (!order.proofScreenshotUrl) return null;
  return specialOrderProofImageUrl(
    order.proofScreenshotUrl,
    order.paymentToken,
  );
}

function statusTone(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-300";
  if (status === "PROOF_SUBMITTED") return "bg-blue-500/10 text-blue-300";
  return "bg-white/[0.06] text-zinc-400";
}

export function SpecialOrdersManager({
  initialOrders,
}: {
  initialOrders: SpecialOrderRecord[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>(() =>
    initialOrders.some((order) => order.paymentStatus === "PROOF_SUBMITTED")
      ? "RECEIPTS"
      : "UNPAID",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter === "PAID" && order.paymentStatus !== "PAID") return false;
      if (filter === "UNPAID" && order.paymentStatus === "PAID") return false;
      if (
        filter === "RECEIPTS" &&
        order.paymentStatus !== "PROOF_SUBMITTED"
      ) {
        return false;
      }
      if (!q) return true;
      const hay = [
        specialOrderFullName(order),
        order.email,
        order.phoneNumber,
        ...specialOrderItemSummary(order),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, search, filter]);

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    const result = await apiGet<{ orders: SpecialOrderRecord[] }>(
      "/api/admin/special-orders",
      "refresh special orders",
    );
    setRefreshing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders(result.data.orders);
  };

  const approve = async (order: SpecialOrderRecord) => {
    if (
      !specialOrderHasUploadedProof(order) &&
      !confirm(
        `No receipt uploaded for ${specialOrderFullName(order)}. Mark as paid anyway?`,
      )
    ) {
      return;
    }
    setBusyId(order.id);
    setError(null);
    const result = await apiPost<{ order: SpecialOrderRecord }>(
      `/api/admin/special-orders/${order.id}/approve`,
      {},
      "approve special order payment",
    );
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders((prev) =>
      prev.map((row) => (row.id === order.id ? result.data.order : row)),
    );
  };

  const remove = async (order: SpecialOrderRecord) => {
    if (!confirm(`Delete ${specialOrderFullName(order)}'s special order?`)) {
      return;
    }
    setBusyId(order.id);
    setError(null);
    const result = await apiDelete(`/api/admin/special-orders/${order.id}`);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders((prev) => prev.filter((row) => row.id !== order.id));
  };

  const copyPayLink = async (order: SpecialOrderRecord) => {
    const url = `${window.location.origin}${specialOrderPaymentPath(order.paymentToken)}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Fixed package: warm-up T-shirt (free) + match quarter zip (
          {formatMembershipEuro(SPECIAL_ORDER_TOTAL_EUR)}). Due{" "}
          {SPECIAL_ORDER_DUE_LABEL}.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <FormError message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, size…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["ALL", "All"],
              ["UNPAID", "Unpaid"],
              ["RECEIPTS", "Receipts"],
              ["PAID", "Paid"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                filter === id
                  ? "border-jackals-red/40 bg-jackals-red/15 text-jackals-red-light"
                  : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {filtered.map((order) => {
          const quote = specialOrderQuote(order);
          const busy = busyId === order.id;
          return (
            <li
              key={order.id}
              className="rounded-xl border border-white/10 bg-jackals-surface/80 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">
                      {specialOrderFullName(order)}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusTone(order.paymentStatus),
                      )}
                    >
                      {specialOrderPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {order.email} · {order.phoneNumber || "No phone"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {specialOrderItemSummary(order).join(" · ")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-white">
                  {formatMembershipEuro(quote.totalEur)}
                </p>
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <KitOrderQuoteBreakdown
                  items={quote.items}
                  totalEur={quote.totalEur}
                  compact
                />
                <AdminReceiptPreview
                  name={specialOrderFullName(order)}
                  email={order.email}
                  amountLabel={formatMembershipEuro(quote.totalEur)}
                  proofUrl={proofUrl(order)}
                  canApprove={order.paymentStatus !== "PAID"}
                  approving={busy}
                  onApprove={() => void approve(order)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyPayLink(order)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy pay link
                </Button>
                <a
                  href={specialOrderPaymentPath(order.paymentToken)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void remove(order)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          No matching special orders.
        </p>
      ) : null}
    </div>
  );
}
