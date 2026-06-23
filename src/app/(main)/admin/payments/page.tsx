import { AdminSection } from "@/components/admin/AdminShell";
import { AdminCsvImport } from "@/components/admin/AdminCsvImport";
import { AdminPaymentQueue } from "@/components/admin/AdminPaymentQueue";
import { adminPendingPaymentWhere } from "@/lib/admin-pending-payments";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin · Payments",
};

export default async function AdminPaymentsPage() {
  const pendingPayments = await prisma.payment.findMany({
    where: adminPendingPaymentWhere(),
    include: {
      user: { select: { name: true, email: true } },
      membership: {
        include: {
          plan: { select: { name: true } },
        },
      },
    },
    orderBy: [{ proofSubmittedAt: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }],
  });

  const recentImports = await prisma.paymentImportRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <AdminSection
      title="Payments"
      description="Import bank CSV files and approve member transfer screenshots."
    >
      <div className="space-y-8">
        <AdminCsvImport />

        <AdminPaymentQueue
          payments={pendingPayments.map((payment) => ({
            id: payment.id,
            amount: payment.amount,
            paymentReference: payment.paymentReference,
            description: payment.description,
            dueDate: payment.dueDate?.toISOString() ?? null,
            proofSubmittedAt: payment.proofSubmittedAt?.toISOString() ?? null,
            proofScreenshotUrl: payment.proofScreenshotUrl,
            user: payment.user,
            subscriptionLabel: payment.membership
              ? {
                  planName: payment.membership.plan.name,
                  paymentSchedule: payment.membership.paymentSchedule,
                }
              : null,
          }))}
        />

        {recentImports.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold text-white">Recent CSV imports</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {recentImports.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-zinc-300">
                    {record.reference ?? "No reference"} · {record.amount.toFixed(2)} EUR
                  </span>
                  <span className="text-zinc-500">
                    {record.status} · {new Date(record.createdAt).toLocaleString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AdminSection>
  );
}
