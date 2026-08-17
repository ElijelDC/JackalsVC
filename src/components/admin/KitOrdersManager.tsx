"use client";

import { useMemo, useState } from "react";
import {
  Clock3,
  Download,
  LayoutGrid,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Rows3,
  Search,
  Shirt,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Input, Select } from "@/components/ui/Input";
import {
  KIT_ORDER_GENDER_LABELS,
  KIT_ORDER_GENDERS,
  KIT_ORDER_KIT_TYPE_LABELS,
  KIT_ORDER_KIT_TYPES,
  jerseyBackName,
  type KitOrderGender,
  type KitOrderKitType,
} from "@/lib/kit-order-config";
import {
  kitOrderFullName,
  kitOrderMerchSummary,
  type KitOrderRecord,
} from "@/lib/kit-order-response-config";
import { apiDelete, apiGet } from "@/lib/client-api";
import { downloadExcelFromUrl } from "@/lib/download-excel";
import { formatOfferSubmittedAt } from "@/lib/offer-response-shared";
import { cn } from "@/lib/utils";

type LayoutMode = "cards" | "compact";
type GenderFilter = "ALL" | KitOrderGender;
type KitTypeFilter = "ALL" | KitOrderKitType;

export function KitOrdersManager({
  initialOrders,
}: {
  initialOrders: KitOrderRecord[];
}) {
  const [orders, setOrders] = useState(initialOrders);
  const [layout, setLayout] = useState<LayoutMode>("cards");
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("ALL");
  const [kitTypeFilter, setKitTypeFilter] = useState<KitTypeFilter>("ALL");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((row) => {
      if (genderFilter !== "ALL" && row.gender !== genderFilter) return false;
      if (kitTypeFilter !== "ALL" && row.kitType !== kitTypeFilter) return false;
      if (!query) return true;

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
  }, [orders, genderFilter, kitTypeFilter, search]);

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
  };

  const clearFilters = () => {
    setGenderFilter("ALL");
    setKitTypeFilter("ALL");
    setSearch("");
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
  };

  const hasFilters =
    genderFilter !== "ALL" || kitTypeFilter !== "ALL" || search.trim() !== "";

  const downloadExcel = async () => {
    setExporting(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (genderFilter !== "ALL") params.set("gender", genderFilter);
      if (kitTypeFilter !== "ALL") params.set("kitType", kitTypeFilter);
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
      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-400">
            Public form:{" "}
            <a
              href="/kit-order"
              className="font-medium text-zinc-200 underline-offset-2 hover:text-white hover:underline"
            >
              /kit-order
            </a>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-white/10">
              {(
                [
                  { id: "cards" as const, icon: LayoutGrid, label: "Cards" },
                  { id: "compact" as const, icon: Rows3, label: "Compact" },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.label}
                  onClick={() => setLayout(option.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition",
                    layout === option.id
                      ? "bg-white/10 text-white"
                      : "bg-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300",
                  )}
                >
                  <option.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
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
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {hasFilters ? "Excel (filtered)" : "Excel"}
                </>
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
                className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, number, size…"
              className="pl-9"
            />
          </div>
          <Select
            value={genderFilter}
            onChange={(event) =>
              setGenderFilter(event.target.value as GenderFilter)
            }
          >
            <option value="ALL">All fits</option>
            {KIT_ORDER_GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {KIT_ORDER_GENDER_LABELS[gender]}
              </option>
            ))}
          </Select>
          <Select
            value={kitTypeFilter}
            onChange={(event) =>
              setKitTypeFilter(event.target.value as KitTypeFilter)
            }
          >
            <option value="ALL">All kits</option>
            {KIT_ORDER_KIT_TYPES.map((kitType) => (
              <option key={kitType} value={kitType}>
                {KIT_ORDER_KIT_TYPE_LABELS[kitType]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            Showing{" "}
            <span className="font-medium text-zinc-300">{filtered.length}</span>
            {filtered.length !== orders.length ? (
              <span> of {orders.length}</span>
            ) : null}
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      <FormError message={error} />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-base font-semibold text-white">
            {orders.length === 0 ? "No kit orders yet" : "No matching orders"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {orders.length === 0
              ? "Orders from /kit-order will appear here, and you can download them as Excel."
              : "Try a different search or clear your filters."}
          </p>
        </div>
      ) : layout === "compact" ? (
        <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 bg-white/[0.02] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">
                    {kitOrderFullName(row)}
                  </p>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-400 ring-1 ring-inset ring-white/8">
                    {row.genderLabel} · {row.kitPiecesLabel || row.kitTypeLabel} ·{" "}
                    {row.kitSize}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {jerseyBackName(row.lastName)} · #{row.preferredKitNumber1} / #
                  {row.preferredKitNumber2} · {row.email}
                  {row.phoneNumber ? ` · ${row.phoneNumber}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-xs text-zinc-600">
                  {formatOfferSubmittedAt(row.createdAt)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-zinc-500 hover:text-rose-300"
                  disabled={deletingId === row.id}
                  onClick={() => void handleDelete(row)}
                  aria-label={`Delete ${kitOrderFullName(row)}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => {
            const merch = kitOrderMerchSummary(row);

            return (
              <article
                key={row.id}
                className="rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                        {kitOrderFullName(row)}
                      </h2>
                      <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/8">
                        {row.genderLabel}
                      </span>
                      <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-zinc-400 ring-1 ring-inset ring-white/8">
                        {row.kitPiecesLabel || row.kitTypeLabel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      <a
                        href={`mailto:${row.email}`}
                        className="inline-flex min-w-0 items-center gap-1.5 text-sm text-zinc-300 transition hover:text-jackals-gold"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate">{row.email}</span>
                      </a>
                      {row.phoneNumber ? (
                        <a
                          href={`tel:${row.phoneNumber}`}
                          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-white"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                          {row.phoneNumber}
                        </a>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/5 pt-3 text-sm">
                      <div className="inline-flex items-center gap-2 text-zinc-300">
                        <Shirt className="h-3.5 w-3.5 text-zinc-500" />
                        <span className="text-zinc-500">Jersey</span>
                        <span className="font-medium tracking-wide text-white">
                          {jerseyBackName(row.lastName)}
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className="font-medium text-white">
                          {row.kitSize}
                        </span>
                      </div>
                      <div className="text-zinc-300">
                        <span className="text-zinc-500">Numbers</span>{" "}
                        <span className="font-medium text-white">
                          #{row.preferredKitNumber1}
                        </span>
                        <span className="text-zinc-600"> / </span>
                        <span className="font-medium text-white">
                          #{row.preferredKitNumber2}
                        </span>
                      </div>
                    </div>

                    {merch.length > 0 ? (
                      <p className="text-sm text-zinc-400">
                        {merch.join(" · ")}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-600">
                        Kit only — no training top or jacket
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2 sm:pt-1">
                    <p className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatOfferSubmittedAt(row.createdAt)}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-zinc-500 hover:text-rose-300"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDelete(row)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      {deletingId === row.id ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
