"use client";

import { Fragment, useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Check, ChevronDown, Loader2, Pencil, Trash2, X } from "lucide-react";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";
import { cn, formatPrice } from "@/lib/utils";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  size: string | null;
  product: { id: string; name: string };
};

type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user: { id: string; name: string; email: string };
  items: OrderItem[];
};

const STATUSES = ["PENDING", "PAID", "SHIPPED", "CANCELLED"] as const;

function statusTone(status: string) {
  if (status === "PAID" || status === "SHIPPED")
    return "text-emerald-300 bg-emerald-500/10";
  if (status === "PENDING") return "text-amber-300 bg-amber-500/10";
  if (status === "CANCELLED") return "text-rose-300 bg-rose-500/10";
  return "text-zinc-400 bg-white/[0.06]";
}

function orderLabel(order: Order) {
  return `#${order.id.slice(-8).toUpperCase()}`;
}

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useSyncedListState(initialOrders);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("PENDING");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setError(null);
  };

  const loadOrders = useCallback(async () => {
    const result = await apiGet<{ orders: Order[] }>("/api/admin/orders");
    if (result.ok) setOrders(result.data.orders);
  }, [setOrders]);

  const startEdit = (order: Order) => {
    setExpandedId(order.id);
    setEditingId(order.id);
    setStatus(order.status as (typeof STATUSES)[number]);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/admin/orders/${editingId}`, { status });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Order updated.");
    resetForm();
    await loadOrders();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/orders/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    if (expandedId === id) setExpandedId(null);
    await loadOrders();
    router.refresh();
  };

  const renderExpanded = (order: Order) => {
    const isEditing = editingId === order.id;
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-500">Email:</span> {order.user.email}
          </p>
          <p>
            <span className="text-zinc-500">Created:</span>{" "}
            {format(new Date(order.createdAt), "d MMM yyyy HH:mm")}
          </p>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Line items
            </p>
            <ul className="mt-2 space-y-1">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.product.name}
                  {item.size ? ` (${item.size})` : ""} —{" "}
                  {formatPrice(item.price)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          {isEditing ? (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div>
                <Label htmlFor={`order-status-${order.id}`}>Status</Label>
                <Select
                  id={`order-status-${order.id}`}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as (typeof STATUSES)[number])
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Update status
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-zinc-400">
                <span className="text-zinc-500">Status:</span> {order.status}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => startEdit(order)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Update status
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminSection
      title="Shop orders"
      description="View shop orders, update fulfilment status, or remove incorrect entries."
    >
      {message ? (
        <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}
      <FormError message={error} />

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span>
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="font-semibold text-white">No orders yet</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-white/10 lg:block">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[6.5rem]" />
                <col />
                <col className="w-[5.5rem]" />
                <col className="w-[5.5rem]" />
                <col className="w-[5.5rem]" />
              </colgroup>
              <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-2 py-2.5 font-medium">Order</th>
                  <th className="px-2 py-2.5 font-medium">Customer</th>
                  <th className="px-2 py-2.5 font-medium">Total</th>
                  <th className="px-2 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {orders.map((order) => {
                  const expanded = expandedId === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr className="bg-white/[0.015] transition hover:bg-white/[0.03]">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : order.id)
                            }
                            className="group flex min-w-0 items-center gap-1.5 text-left"
                          >
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 shrink-0 text-zinc-600 transition",
                                expanded && "rotate-180",
                              )}
                            />
                            <span className="truncate font-mono text-xs font-medium text-white group-hover:text-jackals-gold">
                              {orderLabel(order)}
                            </span>
                          </button>
                        </td>
                        <td className="px-2 py-2">
                          <span className="truncate font-medium text-white">
                            {order.user.name}
                          </span>
                        </td>
                        <td className="px-2 py-2 font-semibold text-jackals-gold">
                          {formatPrice(order.total)}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
                              statusTone(order.status),
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              title="Update status"
                              onClick={() => startEdit(order)}
                              className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              disabled={deletingId === order.id}
                              onClick={() => void handleDelete(order.id)}
                              className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                            >
                              {deletingId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-black/20">
                          <td colSpan={5} className="px-4 py-4">
                            {renderExpanded(order)}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 lg:hidden">
            {orders.map((order) => {
              const expanded = expandedId === order.id;
              return (
                <article
                  key={order.id}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : order.id)
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
                          {orderLabel(order)} · {order.user.name}{" "}
                          <span className="text-jackals-gold">
                            {formatPrice(order.total)}
                          </span>
                        </span>
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                            statusTone(order.status),
                          )}
                        >
                          {order.status}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {format(new Date(order.createdAt), "d MMM yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(order)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={deletingId === order.id}
                        onClick={() => void handleDelete(order.id)}
                      >
                        {deletingId === order.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {expanded ? (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      {renderExpanded(order)}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </AdminSection>
  );
}
