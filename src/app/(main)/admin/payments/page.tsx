import { AdminSection } from "@/components/admin/AdminShell";
import { AdminPaymentQueue } from "@/components/admin/AdminPaymentQueue";
import { getTrainingSquads } from "@/lib/training-squads";
import { prisma } from "@/lib/prisma";
import { subMonths } from "date-fns";

export const metadata = {
  title: "Admin · Payments",
};

export default async function AdminPaymentsPage() {
  const completedSince = subMonths(new Date(), 6);

  const [payments, squads] = await Promise.all([
    prisma.payment.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { status: "COMPLETED", paidAt: { gte: completedSince } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            clubMember: { select: { trainingTeamKey: true } },
          },
        },
        membership: {
          include: {
            plan: { select: { name: true } },
          },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
    }),
    getTrainingSquads(),
  ]);

  const squadNameByKey = new Map(squads.map((squad) => [squad.key, squad.name]));

  const recentImports = await prisma.paymentImportRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <AdminSection
      title="Payments"
      description="Import bank statements and approve member transfer screenshots."
    >
      <div className="space-y-4">
        <AdminPaymentQueue
          teams={squads.map((squad) => ({ key: squad.key, name: squad.name }))}
          payments={payments.map((payment) => {
            const trainingTeamKey =
              payment.user.clubMember?.trainingTeamKey ?? null;
            return {
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
              paymentReference: payment.paymentReference,
              description: payment.description,
              dueDate: payment.dueDate?.toISOString() ?? null,
              proofSubmittedAt: payment.proofSubmittedAt?.toISOString() ?? null,
              proofScreenshotUrl: payment.proofScreenshotUrl,
              paidAt: payment.paidAt?.toISOString() ?? null,
              user: {
                name: payment.user.name,
                email: payment.user.email,
              },
              trainingTeamKey,
              teamLabel: trainingTeamKey
                ? (squadNameByKey.get(trainingTeamKey) ?? trainingTeamKey)
                : null,
              subscriptionLabel: payment.membership
                ? {
                    planName: payment.membership.plan.name,
                    paymentSchedule: payment.membership.paymentSchedule,
                  }
                : null,
            };
          })}
        />

        {recentImports.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-white">Recent statement imports</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {recentImports.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-col gap-1 border-b border-white/5 py-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-zinc-300">
                    {record.reference ?? "No reference"} · {record.amount.toFixed(2)} EUR
                  </span>
                  <span className="text-zinc-500">
                    {record.status}
                    {record.matchedKitOrderId ? " · kit" : ""}
                    {record.matchedPaymentId ? " · membership" : ""}
                    {" · "}
                    {new Date(record.createdAt).toLocaleString("en-GB")}
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
