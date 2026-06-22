"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPut } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";

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

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const router = useRouter();
  const [orders, setOrders] = useSyncedListState(initialOrders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("PENDING");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const editingOrder = orders.find((o) => o.id === editingId);

  const resetForm = () => {
    setEditingId(null);
    setError(null);
  };

  const loadOrders = useCallback(async () => {
    const result = await apiGet<{ orders: Order[] }>("/api/admin/orders");
    if (result.ok) setOrders(result.data.orders);
  }, [setOrders]);

  const startEdit = (order: Order) => {
    beginAdminEdit(() => {
      setEditingId(order.id);
      setStatus(order.status as (typeof STATUSES)[number]);
      setError(null);
      setMessage(null);
    });
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
    await loadOrders();
    router.refresh();
  };

  return (
    <AdminSection
      title="Shop orders"
      description="View shop orders, update fulfilment status, or remove incorrect entries."
    >
      {editingOrder && (
        <AdminFormCard
          title={`Order #${editingOrder.id.slice(-8).toUpperCase()}`}
          error={error}
          message={message}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          submitLabel="Update status"
          loading={loading}
        >
          <div className="mb-4 rounded border border-white/10 bg-jackals-inset p-4 text-sm text-zinc-400">
            <p className="text-white">{editingOrder.user.name}</p>
            <p>{editingOrder.user.email}</p>
            <p className="mt-2">
              {format(new Date(editingOrder.createdAt), "d MMM yyyy HH:mm")} ·{" "}
              {formatPrice(editingOrder.total)}
            </p>
            <ul className="mt-3 space-y-1">
              {editingOrder.items.map((item) => (
                <li key={item.id}>
                  {item.quantity}× {item.product.name}
                  {item.size && ` (${item.size})`} — {formatPrice(item.price)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Label htmlFor="order-status">Status</Label>
            <Select
              id="order-status"
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
        </AdminFormCard>
      )}

      {!editingOrder && error && (
        <p className="mb-4 text-sm text-jackals-red-light">{error}</p>
      )}

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          All orders ({orders.length})
        </h3>
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-400">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <AdminListItem
              key={order.id}
              title={`#${order.id.slice(-8).toUpperCase()} · ${order.user.name}`}
              subtitle={`${formatPrice(order.total)} · ${order.status} · ${format(new Date(order.createdAt), "d MMM yyyy")} · ${order.items.length} item${order.items.length !== 1 ? "s" : ""}`}
              onEdit={() => startEdit(order)}
              onDelete={() => handleDelete(order.id)}
              deleting={deletingId === order.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
