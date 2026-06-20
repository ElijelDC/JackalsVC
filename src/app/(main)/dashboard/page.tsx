import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { formatPrice } from "@/lib/utils";
import { Bell, Package, Users } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const [memberships, orders, reminders] = await Promise.all([
    prisma.membership.findMany({
      where: { userId: session.user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.eventReminder.findMany({
      where: { userId: session.user.id },
      include: { event: true },
      orderBy: { event: { startDate: "asc" } },
    }),
  ]);

  const activeMembership = memberships.find(
    (m) => m.status === "ACTIVE" && m.endDate > new Date(),
  );

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${session.user.name?.split(" ")[0]}`}
        description="Your Jackals VC account overview"
      />

      <div className="grid gap-6 md:grid-cols-3">
        <StatCard icon={Users} title="Membership">
          {activeMembership ? (
            <>
              <span className="text-green-400">Active</span> —{" "}
              {activeMembership.plan.name}
              <br />
              Expires {format(activeMembership.endDate, "d MMM yyyy")}
            </>
          ) : (
            <>
              No active membership.{" "}
              <Link href="/membership" className="text-jackals-red-light hover:text-jackals-red">
                View plans
              </Link>
            </>
          )}
        </StatCard>

        <StatCard icon={Package} title="Orders">
          {orders.length} order{orders.length !== 1 ? "s" : ""} placed
        </StatCard>

        <StatCard icon={Bell} title="Reminders">
          {reminders.length} upcoming event reminder
          {reminders.length !== 1 ? "s" : ""}
        </StatCard>
      </div>

      {reminders.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display mb-4 text-xl font-semibold text-white">
            Your reminders
          </h2>
          <div className="space-y-3">
            {reminders.map(({ event }) => (
              <Card key={event.id} className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium text-white">{event.title}</p>
                  <p className="text-sm text-zinc-500">
                    {format(event.startDate, "EEEE, d MMMM yyyy")}
                  </p>
                </div>
                <Badge>{event.type}</Badge>
              </Card>
            ))}
          </div>
        </section>
      )}

      {orders.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display mb-4 text-xl font-semibold text-white">
            Recent orders
          </h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {format(order.createdAt, "d MMM yyyy")} · {order.status}
                    </p>
                  </div>
                  <span className="font-semibold text-jackals-red-light">
                    {formatPrice(order.total)}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-zinc-400">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.product.name}
                      {item.size && ` (${item.size})`}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
