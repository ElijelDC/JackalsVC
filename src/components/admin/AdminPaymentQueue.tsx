"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormMessage";
import { formatPrice } from "@/lib/utils";
import { apiApprovePayment } from "@/lib/client-api";

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
};

export function AdminPaymentQueue({ payments }: { payments: AdminPendingPayment[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Pending payments</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Review member screenshots and approve payments manually when needed.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300">
          {payments.length} pending
        </span>
      </div>

      <FormError message={error} />

      {payments.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">No pending payments right now.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="rounded-lg border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{payment.user.name}</p>
                  <p className="text-sm text-zinc-500">{payment.user.email}</p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-zinc-500">Amount:</span>{" "}
                      <span className="text-white">{formatPrice(payment.amount, "EUR")}</span>
                    </p>
                    <p>
                      <span className="text-zinc-500">Reference:</span>{" "}
                      <span className="text-white">{payment.paymentReference}</span>
                    </p>
                    {payment.dueDate && (
                      <p>
                        <span className="text-zinc-500">Due:</span>{" "}
                        <span className="text-white">
                          {new Date(payment.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      </p>
                    )}
                    <p>
                      <span className="text-zinc-500">Screenshot:</span>{" "}
                      <span className={payment.proofSubmittedAt ? "text-green-400" : "text-amber-400"}>
                        {payment.proofSubmittedAt ? "Uploaded" : "Not uploaded"}
                      </span>
                    </p>
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
          ))}
        </div>
      )}
    </section>
  );
}
