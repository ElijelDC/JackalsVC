"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AdminFormCard, AdminListItem } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { UserSearchSelect } from "@/components/admin/UserSearchSelect";
import { Input, Label, Select } from "@/components/ui/Input";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";

type Plan = { id: string; name: string; price: number };
type UserOption = { id: string; name: string; email: string };

type Membership = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  user: UserOption;
  plan: Plan;
};

const STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"] as const;

const emptyForm = {
  userId: "",
  planId: "",
  status: "ACTIVE" as (typeof STATUSES)[number],
  endDate: "",
};

export function MembersManager({
  initialMemberships,
  users,
  plans,
}: {
  initialMemberships: Membership[];
  users: UserOption[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [memberships, setMemberships] = useState(initialMemberships);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredMemberships = useMemo(
    () =>
      memberships.filter((membership) =>
        matchesAdminSearch(
          search,
          membership.user.name,
          membership.user.email,
          membership.plan.name,
          membership.status,
        ),
      ),
    [memberships, search],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadMemberships = useCallback(async () => {
    const result = await apiGet<{ memberships: Membership[] }>(
      "/api/admin/memberships",
    );
    if (result.ok) setMemberships(result.data.memberships);
  }, []);

  const startEdit = (membership: Membership) => {
    setEditingId(membership.id);
    setForm({
      userId: membership.user.id,
      planId: membership.plan.id,
      status: membership.status as (typeof STATUSES)[number],
      endDate: format(new Date(membership.endDate), "yyyy-MM-dd"),
    });
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = editingId
      ? await apiPut(`/api/admin/memberships/${editingId}`, {
          status: form.status,
          endDate: new Date(form.endDate).toISOString(),
          planId: form.planId,
        })
      : await apiPost("/api/admin/memberships", {
          userId: form.userId,
          planId: form.planId,
          status: form.status,
        });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Membership updated." : "Membership granted.");
    resetForm();
    await loadMemberships();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this membership?")) return;

    setDeletingId(id);
    const result = await apiDelete(`/api/admin/memberships/${id}`);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (editingId === id) resetForm();
    await loadMemberships();
    router.refresh();
  };

  useEffect(() => {
    setMemberships(initialMemberships);
  }, [initialMemberships]);

  return (
    <AdminSection
      title="Member subscriptions"
      description="View and manage active memberships. Grant access manually or fix expiry dates and statuses."
    >
      <AdminFormCard
        title={editingId ? "Edit membership" : "Grant membership"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Grant membership"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {!editingId && (
            <>
              <div className="sm:col-span-2">
                <UserSearchSelect
                  users={users}
                  value={form.userId}
                  onChange={(userId) => setForm({ ...form, userId })}
                />
              </div>
              <div>
                <Label htmlFor="member-plan">Plan</Label>
                <Select
                  id="member-plan"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  required
                >
                  <option value="">Select plan…</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({formatPrice(plan.price)})
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}
          {editingId && (
            <>
              <div>
                <Label htmlFor="member-plan-edit">Plan</Label>
                <Select
                  id="member-plan-edit"
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="member-end">Expiry date</Label>
                <Input
                  id="member-end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="member-status">Status</Label>
            <Select
              id="member-status"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as (typeof STATUSES)[number],
                })
              }
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
            All subscriptions ({filteredMemberships.length}
            {search.trim() ? ` of ${memberships.length}` : ""})
          </h3>
          <div className="w-full sm:max-w-xs">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, plan…"
            />
          </div>
        </div>
        {filteredMemberships.length === 0 ? (
          <p className="text-sm text-zinc-400">
            {search.trim()
              ? "No memberships match your search."
              : "No memberships yet."}
          </p>
        ) : (
          filteredMemberships.map((membership) => (
          <AdminListItem
            key={membership.id}
            title={`${membership.user.name} — ${membership.plan.name}`}
            subtitle={`${membership.user.email} · ${membership.status} · Expires ${format(new Date(membership.endDate), "d MMM yyyy")}`}
            onEdit={() => startEdit(membership)}
            onDelete={() => handleDelete(membership.id)}
            deleting={deletingId === membership.id}
          />
          ))
        )}
      </div>
    </AdminSection>
  );
}
