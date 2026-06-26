"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox, Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import {
  createMembershipPricing,
  getMonthlyFirstAmount,
  getMonthlyRecurringAmount,
} from "@/lib/membership-config";
import { formatEuroFee } from "@/lib/utils";

type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  active: boolean;
  _count?: { memberships: number };
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  durationMonths: "1",
  active: true,
};

export function MembershipPlansManager({
  initialPlans,
}: {
  initialPlans: MembershipPlan[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useSyncedListState(initialPlans);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadPlans = useCallback(async () => {
    const result = await apiGet<{ plans: MembershipPlan[] }>(
      "/api/admin/membership-plans",
    );
    if (result.ok) setPlans(result.data.plans);
  }, [setPlans]);

  const startEdit = (plan: MembershipPlan) => {
    beginAdminEdit(() => {
      setEditingId(plan.id);
      setForm({
        name: plan.name,
        description: plan.description,
        price: String(plan.price),
        durationMonths: String(plan.durationMonths),
        active: plan.active,
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      durationMonths: Number(form.durationMonths),
      active: form.active,
    };

    const result = editingId
      ? await apiPut(`/api/admin/membership-plans/${editingId}`, payload)
      : await apiPost("/api/admin/membership-plans", payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Plan updated." : "Plan added.");
    resetForm();
    await loadPlans();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this membership plan?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/membership-plans/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    await loadPlans();
    router.refresh();
  };

  const parsedPrice = Number(form.price);
  const parsedDuration = Number(form.durationMonths);
  const pricingPreview =
    form.price && form.durationMonths
      ? createMembershipPricing(parsedPrice, parsedDuration)
      : null;

  return (
    <AdminSection
      title="Membership plans"
            description="Set the membership price shown on the membership checkout."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new plan"
        title={editingId ? "Edit plan" : "Add new plan"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add plan"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="plan-name">Plan name</Label>
            <Input
              id="plan-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Regular"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea
              id="plan-description"
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="plan-price">Membership price (€)</Label>
            <Input
              id="plan-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            {pricingPreview && (
              <p className="mt-1.5 text-xs text-zinc-500">
                Monthly schedule preview: {formatEuroFee(getMonthlyFirstAmount(pricingPreview))} first
                month, then {formatEuroFee(getMonthlyRecurringAmount(pricingPreview))}/mo.
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="plan-duration">Duration (months)</Label>
            <Input
              id="plan-duration"
              type="number"
              min="1"
              value={form.durationMonths}
              onChange={(e) =>
                setForm({ ...form, durationMonths: e.target.value })
              }
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <Checkbox
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Visible on membership page
          </label>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current plans ({plans.length})
        </h3>
        {plans.length === 0 ? (
          <p className="text-sm text-zinc-400">No membership plans yet.</p>
        ) : (
          plans.map((plan) => (
            <AdminListItem
              key={plan.id}
              title={plan.name}
              subtitle={`${formatEuroFee(plan.price)} / ${plan.durationMonths} mo${plan._count?.memberships ? ` · ${plan._count.memberships} member${plan._count.memberships !== 1 ? "s" : ""}` : ""}${plan.active ? "" : " · Hidden"}`}
              onEdit={() => startEdit(plan)}
              onDelete={() => handleDelete(plan.id)}
              deleting={deletingId === plan.id}
            />
          ))
        )}
      </div>
    </AdminSection>
  );
}
