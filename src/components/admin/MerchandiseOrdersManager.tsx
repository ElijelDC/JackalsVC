"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { AdminBankStatementImport } from "@/components/admin/AdminBankStatementImport";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import {
  apiApproveMerchandiseOrderPayment,
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/client-api";
import { downloadExcelFromUrl } from "@/lib/download-excel";
import {
  canApproveMerchandiseOrderPayment,
  merchandiseOrderPaymentPath,
} from "@/lib/merchandise-order-payment-access";
import {
  buildMerchandiseOrderPaymentQuote,
  buildMerchandiseOrderPaymentReference,
} from "@/lib/merchandise-order-payment-summary";
import {
  merchandiseOrderFullName,
  merchandiseOrderItemSummary,
  type MerchandiseOrderRecord,
} from "@/lib/merchandise-order-response-config";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import { cn } from "@/lib/utils";

type PaymentFilter = "ALL" | "PAID" | "UNPAID";

function statusTone(status: string) {
  if (status === "PAID") return "bg-emerald-500/10 text-emerald-300";
  if (status === "PROOF_SUBMITTED") return "bg-blue-500/10 text-blue-300";
  return "bg-white/[0.06] text-zinc-400";
}

export function MerchandiseOrdersManager({
  initialOrders,
  emailConfigured,
}: {
  initialOrders: MerchandiseOrderRecord[];
  emailConfigured: boolean;
  clubIban: string;
  clubAccountHolder: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PaymentFilter>("ALL");
  const [selected, setSelected] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const paid = order.paymentStatus === "PAID";
      if (filter === "PAID" && !paid) return false;
      if (filter === "UNPAID" && paid) return false;
      return (
        !query ||
        [
          merchandiseOrderFullName(order),
          order.email,
          order.phoneNumber,
          order.genderLabel,
          ...merchandiseOrderItemSummary(order),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [filter, orders, search]);

  const totals = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let remainingEur = 0;
    for (const order of orders) {
      const amount = buildMerchandiseOrderPaymentQuote(order).totalEur;
      if (order.paymentStatus === "PAID") paid += 1;
      else {
        unpaid += 1;
        remainingEur += amount;
      }
    }
    return { paid, unpaid, remainingEur };
  }, [orders]);

  const refresh = async () => {
    setRefreshing(true);
    const result = await apiGet<{ orders: MerchandiseOrderRecord[] }>(
      "/api/admin/merchandise-orders",
      "refresh merchandise orders",
    );
    setRefreshing(false);
    if (!result.ok) return setError(result.error);
    setOrders(result.data.orders);
  };

  const approve = async (order: MerchandiseOrderRecord) => {
    setBusyId(order.id);
    setError(null);
    const result = await apiApproveMerchandiseOrderPayment(order.id);
    setBusyId(null);
    if (!result.ok) return setError(result.error);
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? result.data.order : item,
      ),
    );
    setMessage(result.data.message);
  };

  const remove = async (order: MerchandiseOrderRecord) => {
    if (!confirm(`Delete ${merchandiseOrderFullName(order)}'s order?`)) return;
    setBusyId(order.id);
    const result = await apiDelete(`/api/admin/merchandise-orders/${order.id}`);
    setBusyId(null);
    if (!result.ok) return setError(result.error);
    setOrders((current) => current.filter((item) => item.id !== order.id));
  };

  const saveFreeItems = async (
    order: MerchandiseOrderRecord,
    freeLineItemIds: string[],
  ) => {
    setBusyId(order.id);
    const result = await apiPut<{ order: MerchandiseOrderRecord }>(
      `/api/admin/merchandise-orders/${order.id}`,
      { freeLineItemIds },
      "save free merchandise items",
    );
    setBusyId(null);
    if (!result.ok) return setError(result.error);
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? result.data.order : item,
      ),
    );
  };

  const sendEmails = async () => {
    if (!selected.length) return;
    setSending(true);
    const result = await apiPost<{
      delivered: number;
      failed: number;
    }>(
      "/api/admin/merchandise-orders/send-payment-email",
      { orderIds: selected },
      "send merchandise payment emails",
    );
    setSending(false);
    if (!result.ok) return setError(result.error);
    setMessage(
      `Sent ${result.data.delivered} payment email${
        result.data.delivered === 1 ? "" : "s"
      }${result.data.failed ? `; ${result.data.failed} failed` : ""}.`,
    );
    setSelected([]);
    void refresh();
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const query = search.trim()
        ? `?search=${encodeURIComponent(search.trim())}`
        : "";
      await downloadExcelFromUrl(
        `/api/admin/merchandise-orders/export${query}`,
        "jackals-vc-merchandise-orders.xlsx",
      );
    } catch {
      setError("Couldn't download the Excel sheet.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminBankStatementImport
        focus="merchandise"
        endpoint="merchandise"
        onImported={() => {
          setMessage("Bank statement imported and matching merch payments approved.");
          void refresh();
        }}
      />

      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Unpaid", String(totals.unpaid)],
          ["Paid", String(totals.paid)],
          ["Remaining", formatMembershipEuro(totals.remainingEur)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={!emailConfigured || !selected.length || sending}
            onClick={() => void sendEmails()}
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : `Send payment email (${selected.length})`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exporting}
            onClick={() => void exportExcel()}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, item or size…"
              className="pl-9"
            />
          </div>
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {(["ALL", "UNPAID", "PAID"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={cn(
                  "px-4 py-2 text-xs font-medium",
                  filter === value ? "bg-white/10 text-white" : "text-zinc-500",
                )}
              >
                {value === "ALL" ? "All" : value === "PAID" ? "Paid" : "Unpaid"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? (
        <div className="flex gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          <CheckCircle2 className="h-4 w-4" /> {message}
        </div>
      ) : null}
      <FormError message={error} />

      <div className="space-y-3">
        {filtered.map((order) => {
          const quote = buildMerchandiseOrderPaymentQuote(order);
          const baseQuote = buildMerchandiseOrderPaymentQuote({
            ...order,
            freeLineItemIds: [],
          });
          return (
            <article
              key={order.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(order.id)}
                    onChange={() =>
                      setSelected((current) =>
                        current.includes(order.id)
                          ? current.filter((id) => id !== order.id)
                          : [...current, order.id],
                      )
                    }
                    className="mt-1 h-4 w-4"
                  />
                  <div>
                    <h2 className="font-semibold text-white">
                      {merchandiseOrderFullName(order)} ·{" "}
                      <span className="text-jackals-gold">
                        {formatMembershipEuro(quote.totalEur)}
                      </span>
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {order.email} · {order.genderLabel}
                    </p>
                    <p className="mt-1 text-sm text-zinc-300">
                      {merchandiseOrderItemSummary(order).join(" · ")}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-full px-2 py-0.5 text-xs",
                        statusTone(order.paymentStatus),
                      )}
                    >
                      {order.paymentStatus.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {canApproveMerchandiseOrderPayment(order) ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busyId === order.id}
                      onClick={() => void approve(order)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        `${window.location.origin}${merchandiseOrderPaymentPath(
                          order.paymentToken,
                        )}`,
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === order.id}
                    onClick={() => void remove(order)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <details className="mt-4 border-t border-white/10 pt-3">
                <summary className="cursor-pointer text-sm text-zinc-400">
                  Breakdown, receipt and free items
                </summary>
                <div className="mt-4 grid gap-5 lg:grid-cols-2">
                  <KitOrderQuoteBreakdown
                    items={quote.items}
                    totalEur={quote.totalEur}
                    compact
                  />
                  <div className="space-y-3 text-sm">
                    <p className="text-zinc-400">
                      Reference:{" "}
                      <span className="font-mono text-zinc-200">
                        {buildMerchandiseOrderPaymentReference(order)}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={merchandiseOrderPaymentPath(order.paymentToken)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-jackals-gold hover:underline"
                      >
                        Pay page <ExternalLink className="h-3 w-3" />
                      </a>
                      {order.proofScreenshotUrl ? (
                        <a
                          href={order.proofScreenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-jackals-gold hover:underline"
                        >
                          Receipt <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                    <FreeItemEditor
                      order={order}
                      items={baseQuote.items}
                      busy={busyId === order.id}
                      onSave={(ids) => void saveFreeItems(order, ids)}
                    />
                  </div>
                </div>
              </details>
            </article>
          );
        })}
        {!filtered.length ? (
          <p className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center text-zinc-500">
            No matching merchandise orders.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function FreeItemEditor({
  order,
  items,
  busy,
  onSave,
}: {
  order: MerchandiseOrderRecord;
  items: { id: string; label: string; amountEur: number }[];
  busy: boolean;
  onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState(order.freeLineItemIds);
  return (
    <div className="space-y-2 rounded-lg border border-white/10 p-3">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Make items free
      </p>
      {items.map((item) => (
        <label key={item.id} className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={ids.includes(item.id)}
            onChange={(event) =>
              setIds((current) =>
                event.target.checked
                  ? [...current, item.id]
                  : current.filter((id) => id !== item.id),
              )
            }
          />
          <span className="flex-1">{item.label}</span>
          <span className="text-zinc-500">
            {formatMembershipEuro(item.amountEur)}
          </span>
        </label>
      ))}
      <Button
        type="button"
        size="sm"
        disabled={busy}
        onClick={() => onSave(ids)}
      >
        Save free items
      </Button>
    </div>
  );
}
