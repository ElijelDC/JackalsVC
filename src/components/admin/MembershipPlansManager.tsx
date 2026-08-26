"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { FormError } from "@/components/ui/FormMessage";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import {
  createMembershipPricing,
  getMonthlyFirstAmount,
  getMonthlyRecurringAmount,
} from "@/lib/membership-config";
import { cn, formatEuroFee } from "@/lib/utils";

type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  active: boolean;
  _count?: { memberships: number };
};

type PlanFormState = {
  name: string;
  description: string;
  price: string;
  durationMonths: string;
  active: boolean;
};

const emptyForm: PlanFormState = {
  name: "",
  description: "",
  price: "",
  durationMonths: "1",
  active: true,
};

function formFromPlan(plan: MembershipPlan): PlanFormState {
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    durationMonths: String(plan.durationMonths),
    active: plan.active,
  };
}

function PlanFields({
  form,
  setForm,
  idPrefix,
}: {
  form: PlanFormState;
  setForm: (next: PlanFormState) => void;
  idPrefix: string;
}) {
  const parsedPrice = Number(form.price);
  const parsedDuration = Number(form.durationMonths);
  const pricingPreview =
    form.price && form.durationMonths
      ? createMembershipPricing(parsedPrice, parsedDuration)
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>Plan name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Regular"
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-price`}>Membership price (€)</Label>
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        {pricingPreview ? (
          <p className="mt-1.5 text-xs text-zinc-500">
            Monthly schedule preview:{" "}
            {formatEuroFee(getMonthlyFirstAmount(pricingPreview))} first month,
            then {formatEuroFee(getMonthlyRecurringAmount(pricingPreview))}/mo.
          </p>
        ) : null}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-duration`}>Duration (months)</Label>
        <Input
          id={`${idPrefix}-duration`}
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
  );
}

export function MembershipPlansManager({
  initialPlans,
}: {
  initialPlans: MembershipPlan[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useSyncedListState(initialPlans);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlanFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    const result = await apiGet<{ plans: MembershipPlan[] }>(
      "/api/admin/membership-plans",
    );
    if (result.ok) setPlans(result.data.plans);
  }, [setPlans]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError(null);
  };

  const startEdit = (plan: MembershipPlan) => {
    setEditingId(plan.id);
    setEditForm(formFromPlan(plan));
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);
    setListMessage(null);

    const result = await apiPost("/api/admin/membership-plans", {
      name: createForm.name,
      description: createForm.description,
      price: Number(createForm.price),
      durationMonths: Number(createForm.durationMonths),
      active: createForm.active,
    });

    setLoading(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Plan added.");
    setCreateForm(emptyForm);
    cancelEdit();
    await loadPlans();
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(`/api/admin/membership-plans/${editingId}`, {
      name: editForm.name,
      description: editForm.description,
      price: Number(editForm.price),
      durationMonths: Number(editForm.durationMonths),
      active: editForm.active,
    });

    setLoading(false);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Plan updated.");
    cancelEdit();
    await loadPlans();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this membership plan?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/membership-plans/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    if (editingId === id) cancelEdit();
    setListMessage("Plan deleted.");
    await loadPlans();
    router.refresh();
  };

  return (
    <AdminSection
      title="Membership plans"
      description="Set the membership price shown on the membership checkout."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new plan"
        title="Add new plan"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add plan"
        loading={loading && !editingId}
      >
        <PlanFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="plan-create"
        />
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current plans ({plans.length})
        </h3>
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}

        {plans.length === 0 ? (
          <p className="text-sm text-zinc-400">No membership plans yet.</p>
        ) : (
          plans.map((plan) => {
            const isEditing = editingId === plan.id;
            const memberCount = plan._count?.memberships ?? 0;

            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-lg border bg-white/[0.02] transition",
                  isEditing
                    ? "border-jackals-red/40 bg-jackals-red/5 shadow-lg shadow-jackals-red/10"
                    : "border-white/10",
                )}
              >
                {isEditing ? (
                  <form onSubmit={(e) => void handleUpdate(e)} className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-jackals-red-light">
                          Editing
                        </p>
                        <h4 className="mt-0.5 font-medium text-white">
                          {plan.name}
                        </h4>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        <X className="h-4 w-4" />
                        Close
                      </Button>
                    </div>

                    <PlanFields
                      form={editForm}
                      setForm={setEditForm}
                      idPrefix={`plan-edit-${plan.id}`}
                    />

                    <FormError message={editError} />

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={cancelEdit}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-3 px-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white">
                        {plan.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                        {formatEuroFee(plan.price)} / {plan.durationMonths} mo
                        {memberCount
                          ? ` · ${memberCount} member${memberCount !== 1 ? "s" : ""}`
                          : ""}
                        {plan.active ? "" : " · Hidden"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => startEdit(plan)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === plan.id}
                        onClick={() => void handleDelete(plan.id)}
                        className="rounded p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-40"
                      >
                        {deletingId === plan.id ? (
                          <span className="px-1 text-xs">…</span>
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </AdminSection>
  );
}
