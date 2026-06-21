import { prisma } from "@/lib/prisma";
import { OrdersManager } from "@/components/admin/OrdersManager";

export const metadata = { title: "Admin · Orders" };

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: { product: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return <OrdersManager initialOrders={serialized} />;
}
