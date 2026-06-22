"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  AdminSearchBar,
  matchesAdminSearch,
} from "@/components/admin/AdminSearchBar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { Label, Select } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";
import { apiApprovePayment } from "@/lib/client-api";
import { getPendingPaymentDueState } from "@/lib/admin-pending-payments";
import { formatMembershipSubscriptionLabel } from "@/lib/membership-config";

export type AdminPendingPayment = {
  id: string;
  amount: number;
  paymentReference: string;
  description: string;
  dueDate: string | null;
  proofSubmittedAt: string | null;
  proofScreenshotUrl: string | null;
  user: {
    name: string;
    email: string;
  };
  subscriptionLabel: {
    planName: string;
    paymentSchedule: string;
  } | null;
};

const SORT_OPTIONS = [
  { value: "earliest", label: "Earliest" },
  { value: "latest", label: "Latest" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function isPaymentOverdue(payment: AdminPendingPayment, now = new Date()) {
  return getPendingPaymentDueState(payment.dueDate, now) === "overdue";
}

function sortPayments(payments: AdminPendingPayment[], sortBy: SortOption) {
  const sorted = [...payments];

  sorted.sort((a, b) => {
    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return sortBy === "earliest" ? aDue - bDue : bDue - aDue;
  });

  return sorted;
}

export function AdminPaymentQueue({ payments }: { payments: AdminPendingPayment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("earliest");

  const filteredPayments = useMemo(() => {
    const filtered = payments.filter((payment) => {
      const subscriptionLabel = payment.subscriptionLabel
        ? formatMembershipSubscriptionLabel(
            payment.subscriptionLabel.planName,
            payment.subscriptionLabel.paymentSchedule,
          )
        : "";

      return matchesAdminSearch(
        search,
        payment.user.name,
        payment.user.email,
        payment.paymentReference,
        payment.description,
        subscriptionLabel,
        payment.amount.toString(),
        formatPrice(payment.amount, "EUR"),
      );
    });

    return sortPayments(filtered, sortBy);
  }, [payments, search, sortBy]);

  const approvePayment = async (paymentId: string) => {
    setLoadingId(paymentId);
    setError(null);

    const result = await apiApprovePayment(paymentId);
    setLoadingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  };

  const hasActiveFilters = search.trim().length > 0 || sortBy !== "earliest";

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending payments</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Members who have uploaded an IBAN transfer screenshot for a payment that is due
            now or overdue. Future instalments appear here once their due date arrives.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">
          {filteredPayments.length === payments.length
            ? `${payments.length} pending`
            : `${filteredPayments.length} of ${payments.length} pending`}
        </span>
      </div>

      {payments.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <AdminSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search name, email, reference, amount…"
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="payment-sort">Sort by</Label>
              <Select
                id="payment-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSortBy("earliest");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      <FormError message={error} />

      {payments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          No payments awaiting approval. Members appear here after they upload a transfer
          screenshot for a due or overdue instalment.
        </p>
      ) : filteredPayments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No payments match your search.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredPayments.map((payment) => {
            const overdue = isPaymentOverdue(payment);

            return (
              <article
                key={payment.id}
                className="rounded-lg border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{payment.user.name}</p>
                    <p className="text-sm text-zinc-500">{payment.user.email}</p>
                    {payment.subscriptionLabel && (
                      <p className="mt-1 text-sm font-medium text-jackals-red-light">
                        {formatMembershipSubscriptionLabel(
                          payment.subscriptionLabel.planName,
                          payment.subscriptionLabel.paymentSchedule,
                        )}
                      </p>
                    )}
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-zinc-500">Amount:</span>{" "}
                        <span className="text-white">
                          {formatPrice(payment.amount, "EUR")}
                        </span>
                      </p>
                      <p>
                        <span className="text-zinc-500">Reference:</span>{" "}
                        <span className="text-white">{payment.paymentReference}</span>
                      </p>
                      {payment.dueDate && (
                        <p>
                          <span className="text-zinc-500">Due:</span>{" "}
                          <span className={overdue ? "text-red-400" : "text-white"}>
                            {new Date(payment.dueDate).toLocaleDateString("en-GB")}
                            {overdue ? " · overdue" : " · due now"}
                          </span>
                        </p>
                      )}
                      {payment.proofSubmittedAt && (
                        <p>
                          <span className="text-zinc-500">Screenshot:</span>{" "}
                          <span className="text-green-400">
                            Uploaded{" "}
                            {new Date(payment.proofSubmittedAt).toLocaleDateString("en-GB")}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0"
                    disabled={loadingId === payment.id}
                    onClick={() => approvePayment(payment.id)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {loadingId === payment.id ? "Approving..." : "Mark as paid"}
                  </Button>
                </div>

                {payment.proofScreenshotUrl && (
                  <div className="relative mt-4 h-48 w-full overflow-hidden rounded-md border border-white/10">
                    <Image
                      src={payment.proofScreenshotUrl}
                      alt={`Payment proof for ${payment.user.name}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
