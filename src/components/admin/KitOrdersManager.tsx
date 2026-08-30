"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  LayoutGrid,
  Loader2,
  RefreshCw,
  Rows3,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminBankStatementImport } from "@/components/admin/AdminBankStatementImport";
import { AdminReceiptPreview } from "@/components/admin/AdminReceiptPreview";
import { FormError } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { KitOrderQuoteBreakdown } from "@/components/kit-order/KitOrderQuoteBreakdown";
import {
  buildKitOrderPaymentQuote,
  buildKitOrderPaymentReference,
} from "@/lib/kit-order-payment-summary";
import {
  kitOrderHasUploadedProof,
  kitOrderPaymentPath,
  kitOrderProofImageUrl,
} from "@/lib/kit-order-payment-access";
import {
  jerseyBackName,
} from "@/lib/kit-order-config";
import {
  kitOrderFullName,
  kitOrderMerchSummary,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";
import { formatMembershipEuro } from "@/lib/membership-2026-27";
import { apiApproveKitOrderPayment, apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { downloadExcelFromUrl } from "@/lib/download-excel";
import { formatOfferSubmittedAt } from "@/lib/offer-response-shared";
import { cn } from "@/lib/utils";

type ViewMode = "table" | "cards";
type PaymentFilter = "ALL" | "RECEIPTS" | "PAID" | "UNPAID";

type SendResult = {
  attempted: number;
  delivered: number;
  failed: number;
  failures: string[];
};

function formatIban(iban: string) {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

function paymentStatusTone(status: string) {
  if (status === "PAID") return "text-emerald-300 bg-emerald-500/10";
  if (status === "PROOF_SUBMITTED") return "text-blue-300 bg-blue-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function kitPaymentStatusShort(status: string) {
  if (status === "PAID") return "Paid";
  if (status === "PROOF_SUBMITTED") return "Receipt";
  return "Awaiting";
}

function kitProofUrl(row: KitOrderRecord) {
  if (!row.proofScreenshotUrl) return null;
  if (!row.paymentToken) return row.proofScreenshotUrl;
  return kitOrderProofImageUrl(row.proofScreenshotUrl, row.paymentToken);
}

function isKitOrderPaid(row: KitOrderRecord) {
  return (row.paymentStatus ?? "AWAITING") === "PAID";
}

function KitOrderFreeLinesEditor({
  order,
  saving,
  onSave,
}: {
  order: KitOrderRecord;
  saving: boolean;
  onSave: (freeLineItemIds: string[]) => void;
}) {
  const baseQuote = buildKitOrderPaymentQuote({
    ...order,
    freeLineItemIds: [],
  });
  const savedIds = order.freeLineItemIds ?? [];
  const [draft, setDraft] = useState<string[]>(savedIds);

  useEffect(() => {
    setDraft(order.freeLineItemIds ?? []);
  }, [order.id, order.freeLineItemIds]);

  const dirty =
    draft.slice().sort().join(",") !== savedIds.slice().sort().join(",");

  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">
        Make items free
      </p>
      <p className="text-xs text-zinc-500">
        Waive line items for this person before sending the payment email. Totals
        on the pay page and email update immediately.
      </p>
      <ul className="space-y-1.5">
        {baseQuote.items.map((item) => {
          const checked = draft.includes(item.id);
          return (
            <li key={item.id}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={saving}
                  onChange={(event) => {
                    setDraft((current) =>
                      event.target.checked
                        ? [...current, item.id]
                        : current.filter((id) => id !== item.id),
                    );
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-black/30"
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatMembershipEuro(item.amountEur)}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        size="sm"
        disabled={saving || !dirty}
        onClick={() => onSave(draft)}
      >
        {saving ? "Saving…" : "Save free items"}
      </Button>
    </div>
  );
}

function kitSummaryShort(row: KitOrderRecord) {
  const label = row.kitPiecesLabel || row.kitTypeLabel;
  if (label.length <= 28) return label;
  if (row.kitType === "both") return "Player + libero";
  if (row.kitType === "libero") return "Libero kit";
  return "Home kit";
}

export function KitOrdersManager({
  initialOrders,
  emailConfigured,
  clubIban,
  clubAccountHolder,
}: {
  initialOrders: KitOrderRecord[];
  emailConfigured: boolean;
  clubIban: string;
  clubAccountHolder: string;
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [view, setView] = useState<ViewMode>("table");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>(() =>
    initialOrders.some((row) => row.paymentStatus === "PROOF_SUBMITTED")
      ? "RECEIPTS"
      : "UNPAID",
  );
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [savingFreeId, setSavingFreeId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waivedOpen, setWaivedOpen] = useState(false);
  const [confirmOrderIds, setConfirmOrderIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filterBase = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;

    return orders.filter((row) => {
      const haystack = [
        row.firstName,
        row.lastName,
        kitOrderFullName(row),
        row.email,
        row.phoneNumber,
        row.genderLabel,
        row.kitTypeLabel,
        row.kitPiecesLabel,
        row.kitSize,
        row.jerseySize,
        row.shortsSize,
        row.preferredKitNumber1,
        row.preferredKitNumber2,
        ...kitOrderMerchSummary(row),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orders, search]);

  const filtered = useMemo(() => {
    const rows = filterBase.filter((row) => {
      const paid = isKitOrderPaid(row);
      const hasReceipt = kitOrderHasUploadedProof(row);
      if (paymentFilter === "PAID" && !paid) return false;
      if (paymentFilter === "UNPAID" && paid) return false;
      if (paymentFilter === "RECEIPTS" && (paid || !hasReceipt)) return false;
      return true;
    });

    return [...rows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [filterBase, paymentFilter]);

  const stats = useMemo(() => {
    let unpaid = 0;
    let paid = 0;
    let waived = 0;
    let totalRemaining = 0;
    let totalPaid = 0;
    let totalWaived = 0;
    const waivedDetails: Array<{
      id: string;
      name: string;
      email: string;
      items: Array<{ id: string; label: string; amountEur: number }>;
      waivedEur: number;
    }> = [];

    for (const row of filterBase) {
      const amount = buildKitOrderPaymentQuote(row).totalEur;
      const freeIds = row.freeLineItemIds ?? [];
      if (freeIds.length > 0) {
        const fullQuote = buildKitOrderPaymentQuote({
          ...row,
          freeLineItemIds: [],
        });
        const waivedEur = Math.max(0, fullQuote.totalEur - amount);
        waived += 1;
        totalWaived += waivedEur;
        const freeSet = new Set(freeIds);
        waivedDetails.push({
          id: row.id,
          name: kitOrderFullName(row),
          email: row.email,
          items: fullQuote.items
            .filter((item) => freeSet.has(item.id))
            .map((item) => ({
              id: item.id,
              label: item.label,
              amountEur: item.amountEur,
            })),
          waivedEur,
        });
      }
      if (isKitOrderPaid(row)) {
        paid += 1;
        totalPaid += amount;
      } else {
        unpaid += 1;
        totalRemaining += amount;
      }
    }

    waivedDetails.sort((a, b) => a.name.localeCompare(b.name));
    return {
      unpaid,
      paid,
      waived,
      totalRemaining,
      totalPaid,
      totalWaived,
      waivedDetails,
    };
  }, [filterBase]);

  const selectedOrders = useMemo(
    () => filtered.filter((row) => selectedIds.includes(row.id)),
    [filtered, selectedIds],
  );

  const confirmOrders = useMemo(
    () => orders.filter((row) => confirmOrderIds.includes(row.id)),
    [orders, confirmOrderIds],
  );

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((row) => selectedIds.includes(row.id));

  const openConfirm = (orderIds: string[]) => {
    setConfirmOrderIds(orderIds);
    setConfirmOpen(true);
  };

  const copyPaymentLink = async (row: KitOrderRecord) => {
    if (!row.paymentToken) return;
    const url = `${window.location.origin}${kitOrderPaymentPath(row.paymentToken)}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(row.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const refresh = async () => {
    setRefreshing(true);
    setError(null);
    const result = await apiGet<{ orders: KitOrderRecord[] }>(
      "/api/admin/kit-orders",
      "refresh the kit orders list",
    );
    setRefreshing(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders(result.data.orders);
    setSelectedIds((current) => {
      const valid = new Set(result.data.orders.map((order) => order.id));
      return current.filter((id) => valid.has(id));
    });
  };

  const clearFilters = () => {
    setPaymentFilter("ALL");
    setSearch("");
  };

  const hasFilters = paymentFilter !== "ALL" || search.trim() !== "";

  const toggleSelection = (orderId: string) => {
    setSelectedIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !filtered.some((row) => row.id === id)),
      );
      return;
    }
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const row of filtered) next.add(row.id);
      return [...next];
    });
  };

  const handleDelete = async (row: KitOrderRecord) => {
    if (
      !confirm(
        `Delete ${kitOrderFullName(row)}'s kit order? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    setError(null);
    const result = await apiDelete(
      `/api/admin/kit-orders/${row.id}`,
      "delete this kit order",
    );
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOrders((current) => current.filter((item) => item.id !== row.id));
    setSelectedIds((current) => current.filter((id) => id !== row.id));
    if (expandedId === row.id) setExpandedId(null);
  };

  const handleApprove = async (row: KitOrderRecord) => {
    if (isKitOrderPaid(row)) return;
    if (
      !kitOrderHasUploadedProof(row) &&
      !confirm(
        `No receipt uploaded for ${kitOrderFullName(row)}. Mark as paid anyway?`,
      )
    ) {
      return;
    }
    setApprovingId(row.id);
    setError(null);
    setMessage(null);

    const result = await apiApproveKitOrderPayment(row.id);

    setApprovingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === row.id
          ? { ...item, paymentStatus: "PAID" }
          : item,
      ),
    );
    setMessage(
      result.data.message ||
        `Payment approved for ${kitOrderFullName(row)}.`,
    );
  };

  const handleSaveFreeLines = async (
    row: KitOrderRecord,
    freeLineItemIds: string[],
  ) => {
    setSavingFreeId(row.id);
    setError(null);
    setMessage(null);

    const result = await apiPut<{ order: KitOrderRecord }>(
      `/api/admin/kit-orders/${row.id}`,
      { freeLineItemIds },
      "save free kit items",
    );

    setSavingFreeId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOrders((current) =>
      current.map((item) =>
        item.id === row.id ? result.data.order : item,
      ),
    );
    setMessage(`Updated free items for ${kitOrderFullName(row)}.`);
  };

  const sendPaymentEmails = async (orderIds: string[]) => {
    if (orderIds.length === 0) return;
    setError(null);
    setMessage(null);
    return apiPost<SendResult>(
      "/api/admin/kit-orders/send-payment-email",
      { orderIds },
      "send payment emails",
    );
  };

  const handleSendOne = async (row: KitOrderRecord) => {
    setSendingId(row.id);
    const result = await sendPaymentEmails([row.id]);
    setSendingId(null);
    if (!result?.ok) {
      setError(result?.error ?? "Couldn't send the payment email.");
      return;
    }
    const { delivered, failed } = result.data;
    setMessage(
      failed > 0
        ? `Sent ${delivered}, ${failed} failed.`
        : `Payment email sent to ${row.email}.`,
    );
  };

  const handleBulkSend = async () => {
    setBulkSending(true);
    const result = await sendPaymentEmails(confirmOrderIds);
    setBulkSending(false);
    setConfirmOpen(false);
    setConfirmOrderIds([]);
    if (!result?.ok) {
      setError(result?.error ?? "Couldn't send payment emails.");
      return;
    }
    const { delivered, failed } = result.data;
    setSelectedIds([]);
    setMessage(
      failed > 0
        ? `Sent ${delivered}, ${failed} failed.`
        : `Sent payment details to ${delivered} players.`,
    );
  };

  const downloadExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const query = params.toString();
      await downloadExcelFromUrl(
        query
          ? `/api/admin/kit-orders/export?${query}`
          : "/api/admin/kit-orders/export",
        "jackals-vc-kit-orders.xlsx",
      );
    } catch {
      setError("Couldn't download the Excel sheet. Try again in a moment.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <AdminBankStatementImport
        focus="kit"
        onImported={() => {
          setMessage("Bank statement imported. Matching kit payments were auto-approved.");
          void refresh();
        }}
      />

      <details className="group overflow-hidden rounded-xl border border-jackals-red/25 bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none sm:px-5">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-jackals-gold" />
            <span className="text-sm font-medium text-white">
              Send payment emails
            </span>
            <span className="text-xs text-zinc-500">
              {selectedIds.length} selected · IBAN {formatIban(clubIban)}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-white/10 px-4 py-4 sm:px-5">
          {!emailConfigured ? (
            <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              SMTP not configured — emails cannot be sent yet.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={
                !emailConfigured ||
                selectedOrders.length === 0 ||
                bulkSending ||
                Boolean(sendingId)
              }
              onClick={() => openConfirm(selectedOrders.map((r) => r.id))}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Send to selected ({selectedOrders.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                !emailConfigured ||
                filtered.length === 0 ||
                bulkSending ||
                Boolean(sendingId)
              }
              onClick={() => openConfirm(filtered.map((r) => r.id))}
            >
              Send to all shown ({filtered.length})
            </Button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Account: {clubAccountHolder}
          </p>
        </div>
      </details>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Unpaid", value: String(stats.unpaid) },
          { label: "Paid", value: String(stats.paid) },
          {
            label: "Total remaining",
            value: formatMembershipEuro(stats.totalRemaining),
          },
          {
            label: "Total paid",
            value: formatMembershipEuro(stats.totalPaid),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
          >
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">
              {item.label}
            </p>
            <p className="mt-0.5 text-lg font-semibold text-white">{item.value}</p>
          </div>
        ))}
        <button
          type="button"
          disabled={stats.waived === 0}
          onClick={() => setWaivedOpen(true)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left transition",
            stats.waived > 0
              ? "border-amber-500/30 bg-amber-500/10 hover:border-amber-400/45 hover:bg-amber-500/15"
              : "cursor-default border-white/10 bg-white/[0.02] opacity-70",
          )}
        >
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            Waived
          </p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {stats.waived > 0
              ? `${stats.waived} · ${formatMembershipEuro(stats.totalWaived)}`
              : "0"}
          </p>
          {stats.waived > 0 ? (
            <p className="mt-1 text-[11px] text-amber-200/80">View details</p>
          ) : null}
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-400">
            Form:{" "}
            <a href="/kit-order" className="text-zinc-200 hover:underline">
              /kit-order
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden overflow-hidden rounded-lg border border-white/10 lg:flex">
              {(
                [
                  { id: "table" as const, icon: Rows3, label: "Table" },
                  { id: "cards" as const, icon: LayoutGrid, label: "Cards" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setView(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
                    view === option.id
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  <option.icon className="h-3.5 w-3.5" />
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={exporting}
              onClick={() => void downloadExcel()}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={refreshing}
              onClick={() => void refresh()}
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, number…"
              className="pl-9"
            />
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-white/10">
            {(
              [
                { value: "RECEIPTS" as const, label: "To review" },
                { value: "UNPAID" as const, label: "Unpaid" },
                { value: "PAID" as const, label: "Paid" },
                { value: "ALL" as const, label: "All" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPaymentFilter(option.value)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition",
                  paymentFilter === option.value
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span>
            {filtered.length} shown
            {filtered.length !== orders.length ? ` of ${orders.length}` : ""}
          </span>
          <button type="button" onClick={toggleSelectAllFiltered} className="hover:text-zinc-300">
            {allFilteredSelected ? "Deselect all" : "Select all shown"}
          </button>
          {selectedIds.length > 0 ? (
            <button type="button" onClick={() => setSelectedIds([])} className="hover:text-zinc-300">
              Clear selection
            </button>
          ) : null}
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="hover:text-zinc-300">
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {message ? (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      ) : null}

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="font-semibold text-white">No matching orders</p>
        </div>
      ) : (
        <>
          {view === "table" ? (
            <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-10" />
                  <col />
                  <col className="w-[4.5rem]" />
                  <col className="w-[7.5rem]" />
                  <col className="w-[6.5rem]" />
                </colgroup>
                <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        aria-label="Select all"
                        className="h-4 w-4 rounded border-white/20 bg-black/30"
                      />
                    </th>
                    <th className="px-2 py-2.5 font-medium">Player</th>
                    <th className="px-2 py-2.5 font-medium">Total</th>
                    <th className="px-2 py-2.5 font-medium">Payment</th>
                    <th className="px-2 py-2.5 font-medium">Receipt</th>
                    <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
            <tbody className="divide-y divide-white/8">
              {filtered.map((row) => {
                const total = buildKitOrderPaymentQuote(row).totalEur;
                const status = row.paymentStatus ?? "AWAITING";
                const expanded = expandedId === row.id;
                const merch = kitOrderMerchSummary(row);
                const quote = buildKitOrderPaymentQuote(row);

                return (
                  <Fragment key={row.id}>
                    <tr
                      className={cn(
                        "bg-white/[0.015] transition hover:bg-white/[0.03]",
                        selectedIds.includes(row.id) && "bg-jackals-red/5",
                      )}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleSelection(row.id)}
                          aria-label={`Select ${kitOrderFullName(row)}`}
                          className="h-4 w-4 rounded border-white/20 bg-black/30"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : row.id)
                          }
                          className="group flex min-w-0 items-center gap-1.5 text-left"
                        >
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                              expanded && "rotate-180",
                            )}
                          />
                          <span className="truncate font-medium text-white group-hover:text-jackals-gold">
                            {kitOrderFullName(row)}
                          </span>
                        </button>
                      </td>
                      <td className="px-2 py-2 font-semibold text-jackals-gold">
                        {formatMembershipEuro(total)}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                            paymentStatusTone(status),
                          )}
                        >
                          {kitPaymentStatusShort(status)}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        {kitProofUrl(row) ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : row.id)
                            }
                            className="block overflow-hidden rounded border border-white/15 bg-black"
                            title="View receipt"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={kitProofUrl(row)!}
                              alt=""
                              className="h-14 w-20 object-cover"
                            />
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-600">None</span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-end gap-1">
                          {!isKitOrderPaid(row) ? (
                            <button
                              type="button"
                              title="Approve payment"
                              disabled={approvingId === row.id}
                              onClick={() => void handleApprove(row)}
                              className="rounded p-1.5 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-300 disabled:opacity-40"
                            >
                              {approvingId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            title="Copy pay link"
                            disabled={!row.paymentToken}
                            onClick={() => void copyPaymentLink(row)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Send payment email"
                            disabled={
                              !emailConfigured ||
                              sendingId === row.id ||
                              bulkSending
                            }
                            onClick={() => void handleSendOne(row)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white disabled:opacity-40"
                          >
                            {sendingId === row.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDelete(row)}
                            className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {copiedId === row.id ? (
                          <p className="mt-0.5 text-right text-[10px] text-emerald-400">
                            Copied
                          </p>
                        ) : null}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-black/20">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-4">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-zinc-500">
                                  Breakdown
                                </p>
                                <KitOrderQuoteBreakdown
                                  items={quote.items}
                                  totalEur={quote.totalEur}
                                  compact
                                  className="mt-2"
                                />
                              </div>
                              <KitOrderFreeLinesEditor
                                order={row}
                                saving={savingFreeId === row.id}
                                onSave={(ids) =>
                                  void handleSaveFreeLines(row, ids)
                                }
                              />
                            </div>
                            <div className="space-y-2 text-sm text-zinc-400">
                              <p>
                                <span className="text-zinc-500">Email:</span>{" "}
                                {row.email}
                              </p>
                              <p>
                                <span className="text-zinc-500">Kit:</span>{" "}
                                {kitSummaryShort(row)} · {row.kitSize}
                              </p>
                              <p>
                                <span className="text-zinc-500">Numbers:</span>{" "}
                                {row.preferredKitNumber1}
                                {row.kitType === "both"
                                  ? ` / ${row.preferredKitNumber2}`
                                  : ""}
                              </p>
                              <p>
                                <span className="text-zinc-500">Jersey:</span>{" "}
                                {jerseyBackName(row.lastName)} · {row.kitSize}
                              </p>
                              <p>
                                <span className="text-zinc-500">Phone:</span>{" "}
                                {row.phoneNumber || "—"}
                              </p>
                              <p>
                                <span className="text-zinc-500">Reference:</span>{" "}
                                <span className="font-mono text-xs text-zinc-300">
                                  {buildKitOrderPaymentReference(row)}
                                </span>
                              </p>
                              {merch.length > 0 ? (
                                <p>
                                  <span className="text-zinc-500">Extras:</span>{" "}
                                  {merch.join(" · ")}
                                </p>
                              ) : null}
                              <p className="text-xs text-zinc-600">
                                Ordered {formatOfferSubmittedAt(row.createdAt)}
                                {row.paymentEmailSentAt
                                  ? ` · Email sent ${formatOfferSubmittedAt(row.paymentEmailSentAt)}`
                                  : ""}
                              </p>
                              <div className="flex flex-wrap gap-2 pt-1">
                                {row.paymentToken ? (
                                  <a
                                    href={kitOrderPaymentPath(row.paymentToken)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-jackals-gold hover:underline"
                                  >
                                    Open pay page
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : null}
                              </div>
                              <AdminReceiptPreview
                                name={kitOrderFullName(row)}
                                email={row.email}
                                amountLabel={formatMembershipEuro(total)}
                                proofUrl={kitProofUrl(row)}
                                canApprove={!isKitOrderPaid(row)}
                                approving={approvingId === row.id}
                                onApprove={() => void handleApprove(row)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
            </div>
          ) : null}

          <div className={cn("space-y-2", view === "table" && "lg:hidden")}>
          {filtered.map((row) => {
            const total = buildKitOrderPaymentQuote(row).totalEur;
            const quote = buildKitOrderPaymentQuote(row);
            const status = row.paymentStatus ?? "AWAITING";
            return (
              <article
                key={row.id}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelection(row.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-white/20"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-white">
                        {kitOrderFullName(row)}{" "}
                        <span className="text-jackals-gold">
                          {formatMembershipEuro(total)}
                        </span>
                      </p>
                      <p className="truncate text-sm text-zinc-500">{row.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                            paymentStatusTone(status),
                          )}
                        >
                          {kitPaymentStatusShort(status)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {kitSummaryShort(row)} · {row.kitSize}
                        </span>
                        <span className="text-xs text-zinc-500">
                          #{row.preferredKitNumber1}
                          {row.kitType === "both"
                            ? `/${row.preferredKitNumber2}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!isKitOrderPaid(row) ? (
                      <Button
                        type="button"
                        size="sm"
                        disabled={approvingId === row.id}
                        onClick={() => void handleApprove(row)}
                      >
                        {approvingId === row.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void handleSendOne(row)}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void handleDelete(row)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <AdminReceiptPreview
                    name={kitOrderFullName(row)}
                    email={row.email}
                    amountLabel={formatMembershipEuro(total)}
                    proofUrl={kitProofUrl(row)}
                    canApprove={!isKitOrderPaid(row)}
                    approving={approvingId === row.id}
                    onApprove={() => void handleApprove(row)}
                    compact
                  />
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-zinc-500">
                    Show breakdown & free items
                  </summary>
                  <KitOrderQuoteBreakdown
                    items={quote.items}
                    totalEur={quote.totalEur}
                    compact
                    className="mt-2"
                  />
                  <div className="mt-3">
                    <KitOrderFreeLinesEditor
                      order={row}
                      saving={savingFreeId === row.id}
                      onSave={(ids) => void handleSaveFreeLines(row, ids)}
                    />
                  </div>
                </details>
              </article>
            );
          })}
          </div>
        </>
      )}

      <Modal
        open={waivedOpen}
        onClose={() => setWaivedOpen(false)}
        title="Waived kit items"
        description={`${stats.waived} order${stats.waived === 1 ? "" : "s"} · ${formatMembershipEuro(stats.totalWaived)} waived in total`}
      >
        {stats.waivedDetails.length === 0 ? (
          <p className="text-sm text-zinc-500">No waived items right now.</p>
        ) : (
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
            {stats.waivedDetails.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{row.name}</p>
                    <p className="truncate text-xs text-zinc-500">{row.email}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-amber-200">
                    −{formatMembershipEuro(row.waivedEur)}
                  </p>
                </div>
                <ul className="mt-2 space-y-1">
                  {row.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm text-zinc-300"
                    >
                      <span>{item.label}</span>
                      <span className="text-zinc-500">
                        {formatMembershipEuro(item.amountEur)}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-jackals-gold hover:underline"
                  onClick={() => {
                    setWaivedOpen(false);
                    setExpandedId(row.id);
                    setPaymentFilter("ALL");
                    setSearch(row.name);
                  }}
                >
                  Open order
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="outline" onClick={() => setWaivedOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!bulkSending) setConfirmOpen(false);
        }}
        title="Send payment emails?"
        description={`Email ${confirmOrders.length} player${confirmOrders.length === 1 ? "" : "s"} their order summary and IBAN.`}
      >
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
          {confirmOrders.map((row) => (
            <li key={row.id} className="flex justify-between gap-3">
              <span>{kitOrderFullName(row)}</span>
              <span className="text-xs text-zinc-500">{row.email}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={bulkSending}
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={bulkSending}
            onClick={() => void handleBulkSend()}
          >
            {bulkSending ? "Sending…" : `Send ${confirmOrders.length}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
