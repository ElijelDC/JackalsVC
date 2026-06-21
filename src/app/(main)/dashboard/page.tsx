import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/auth";
import {
  MemberEventsPanel,
  MemberPaymentsPanel,
} from "@/components/dashboard/MemberDashboardPanels";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { prisma } from "@/lib/prisma";
import { getClubBankDetails } from "@/lib/payments";
import { formatPrice } from "@/lib/utils";
import { Bell, CalendarDays, CreditCard, Package } from "lucide-react";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard");

  const now = new Date();

  const [memberships, payments, orders, reminders, signups, upcomingEvents] =
    await Promise.all([
      prisma.membership.findMany({
        where: { userId: session.user.id },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        where: { userId: session.user.id },
        orderBy: [{ dueDate: "asc" }, { installmentNumber: "asc" }, { createdAt: "asc" }],
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
      prisma.eventSignup.findMany({
        where: { userId: session.user.id, status: "CONFIRMED" },
        select: { eventId: true },
      }),
      prisma.event.findMany({
        where: {
          startDate: { gte: now },
          type: { in: ["TOURNAMENT", "TRAINING", "SOCIAL"] },
        },
        orderBy: { startDate: "asc" },
        take: 10,
      }),
    ]);

  const activeMembership = memberships.find(
    (m) => m.status === "ACTIVE" && m.endDate > now,
  );
  const clubBank = getClubBankDetails();

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome, ${session.user.name?.split(" ")[0] ?? "Member"}`}
        description="Manage your membership, payments, and event sign-ups"
      />

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard icon={CreditCard} title="Membership">
          {activeMembership ? (
            <>
              <span className="text-green-400">Active</span> — {activeMembership.plan.name}
            </>
          ) : (
            <>
              No plan.{" "}
              <Link href="/membership" className="text-jackals-red-light hover:text-jackals-red">
                Subscribe
              </Link>
            </>
          )}
        </StatCard>

        <StatCard icon={CalendarDays} title="Event sign-ups">
          {signups.length} upcoming
        </StatCard>

        <StatCard icon={Package} title="Shop orders">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </StatCard>

        <StatCard icon={Bell} title="Reminders">
          {reminders.length} saved
        </StatCard>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <MemberPaymentsPanel
          memberships={memberships.map((m) => ({
            id: m.id,
            status: m.status,
            paymentSchedule: m.paymentSchedule as "MONTHLY" | "INSTALLMENTS" | "FULL",
            startDate: m.startDate.toISOString(),
            endDate: m.endDate.toISOString(),
            plan: { name: m.plan.name, price: m.plan.price },
          }))}
          payments={payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            description: p.description,
            status: p.status,
            method: p.method,
            paymentReference: p.paymentReference,
            installmentNumber: p.installmentNumber,
            dueDate: p.dueDate?.toISOString() ?? null,
            paidAt: p.paidAt?.toISOString() ?? null,
            proofScreenshotUrl: p.proofScreenshotUrl,
            proofSubmittedAt: p.proofSubmittedAt?.toISOString() ?? null,
            createdAt: p.createdAt.toISOString(),
          }))}
          clubBank={clubBank}
        />

        <MemberEventsPanel
          upcomingEvents={upcomingEvents.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            startDate: e.startDate.toISOString(),
            endDate: e.endDate?.toISOString() ?? null,
            type: e.type,
            location: e.location,
          }))}
          signedUpEventIds={signups.map((s) => s.eventId)}
        />
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
            Recent shop orders
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
