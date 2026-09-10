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
  defaultInstallmentAmounts,
  planInstallmentAmounts,
} from "@/lib/membership-config";
import { cn, formatEuroFee } from "@/lib/utils";

type MembershipPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMonths: number;
  installment1Eur: number | null;
  installment2Eur: number | null;
  installment3Eur: number | null;
  active: boolean;
  _count?: { memberships: number };
};

type PlanFormState = {
  name: string;
  description: string;
  price: string;
  durationMonths: string;
  installment1Eur: string;
  installment2Eur: string;
  installment3Eur: string;
  active: boolean;
};

const emptyForm: PlanFormState = {
  name: "",
  description: "",
  price: "",
  durationMonths: "7",
  installment1Eur: "",
  installment2Eur: "",
  installment3Eur: "",
  active: true,
};

function amountsForPrice(price: number): Pick<
  PlanFormState,
  "installment1Eur" | "installment2Eur" | "installment3Eur"
> {
  const [oct, jan, mar] = defaultInstallmentAmounts(price);
  return {
    installment1Eur: String(oct),
    installment2Eur: String(jan),
    installment3Eur: String(mar),
  };
}

function formFromPlan(plan: MembershipPlan): PlanFormState {
  const configured = planInstallmentAmounts(plan);
  const amounts = configured ?? defaultInstallmentAmounts(plan.price);
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    durationMonths: String(plan.durationMonths),
    installment1Eur: String(amounts[0]),
    installment2Eur: String(amounts[1]),
    installment3Eur: String(amounts[2]),
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
  const installmentSum =
    Number(form.installment1Eur || 0) +
    Number(form.installment2Eur || 0) +
    Number(form.installment3Eur || 0);

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
          onChange={(e) => {
            const price = e.target.value;
            const parsed = Number(price);
            setForm({
              ...form,
              price,
              ...(Number.isFinite(parsed) && parsed > 0
                ? amountsForPrice(parsed)
                : {}),
            });
          }}
          required
        />
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

      <div className="sm:col-span-2 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
        <div>
          <p className="text-sm font-medium text-white">3 instalment amounts</p>
          <p className="mt-1 text-xs text-zinc-500">
            Set October, January, and March separately. They must add up to the
            membership price
            {Number.isFinite(parsedPrice) && parsedPrice > 0
              ? ` (${formatEuroFee(parsedPrice)})`
              : ""}
            . Changing the price refreshes a suggested split you can edit.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor={`${idPrefix}-oct`}>October (€)</Label>
            <Input
              id={`${idPrefix}-oct`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.installment1Eur}
              onChange={(e) =>
                setForm({ ...form, installment1Eur: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-jan`}>January (€)</Label>
            <Input
              id={`${idPrefix}-jan`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.installment2Eur}
              onChange={(e) =>
                setForm({ ...form, installment2Eur: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-mar`}>March (€)</Label>
            <Input
              id={`${idPrefix}-mar`}
              type="number"
              min="0.01"
              step="0.01"
              value={form.installment3Eur}
              onChange={(e) =>
                setForm({ ...form, installment3Eur: e.target.value })
              }
              required
            />
          </div>
        </div>
        <p
          className={cn(
            "text-xs",
            Number.isFinite(parsedPrice) &&
              Math.round(installmentSum * 100) === Math.round(parsedPrice * 100)
              ? "text-emerald-400"
              : "text-amber-300",
          )}
        >
          Instalments total: {formatEuroFee(installmentSum)}
        </p>
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

function planPayload(form: PlanFormState) {
  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    durationMonths: Number(form.durationMonths),
    installment1Eur: Number(form.installment1Eur),
    installment2Eur: Number(form.installment2Eur),
    installment3Eur: Number(form.installment3Eur),
    active: form.active,
  };
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

    const result = await apiPost("/api/admin/membership-plans", planPayload(createForm));

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

    const result = await apiPut(
      `/api/admin/membership-plans/${editingId}`,
      planPayload(editForm),
    );

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
      description="Set the membership price and the three instalment amounts shown at checkout."
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
            const amounts =
              planInstallmentAmounts(plan) ?? defaultInstallmentAmounts(plan.price);

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
                    <div className="mt-4 flex gap-2">
                      <Button type="submit" disabled={loading}>
                        {loading ? "Saving…" : "Save changes"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-white">{plan.name}</h4>
                        {!plan.active ? (
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                            Hidden
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {formatEuroFee(plan.price)} · {plan.durationMonths} months ·{" "}
                        {memberCount} member{memberCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Instalments: Oct {formatEuroFee(amounts[0])} · Jan{" "}
                        {formatEuroFee(amounts[1])} · Mar {formatEuroFee(amounts[2])}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(plan)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={deletingId === plan.id || memberCount > 0}
                        onClick={() => void handleDelete(plan.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
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
