"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormCard } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { UserSearchSelect } from "@/components/admin/UserSearchSelect";
import { Label, Select } from "@/components/ui/Input";
import { apiPost } from "@/lib/client-api";
import { formatPrice } from "@/lib/utils";

type Plan = { id: string; name: string; price: number };
type UserOption = { id: string; name: string; email: string };

const STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED"] as const;

const emptyGrantForm = {
  userId: "",
  planId: "",
  status: "ACTIVE" as (typeof STATUSES)[number],
};

export function GrantMembershipPanel({
  users,
  plans,
}: {
  users: UserOption[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(emptyGrantForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await apiPost("/api/admin/memberships", {
      userId: form.userId,
      planId: form.planId,
      status: form.status,
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setForm(emptyGrantForm);
    setMessage("Membership granted.");
    router.refresh();
  };

  return (
    <AdminSection
      title="Grant membership"
      description="Manually assign a membership plan to a registered user."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Grant membership"
        title="Grant membership"
        formId="admin-grant-membership-form"
        error={error}
        message={message}
        onSubmit={handleSubmit}
        submitLabel={loading ? "Saving..." : "Grant membership"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <UserSearchSelect
              users={users}
              value={form.userId}
              onChange={(userId) => setForm({ ...form, userId })}
            />
          </div>
          <div>
            <Label htmlFor="grant-plan">Plan</Label>
            <Select
              id="grant-plan"
              value={form.planId}
              onChange={(event) =>
                setForm({ ...form, planId: event.target.value })
              }
              required
            >
              <option value="" disabled>
                Select plan…
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({formatPrice(plan.price)})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="grant-status">Status</Label>
            <Select
              id="grant-status"
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as (typeof STATUSES)[number],
                })
              }
              required
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
    </AdminSection>
  );
}
