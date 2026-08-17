import { KitOrdersManager } from "@/components/admin/KitOrdersManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kit orders | Admin" };

export default async function AdminKitOrdersPage() {
  const orders = await prisma.kitOrder.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageContainer>
      <PageHeader
        title="Kit orders"
        description="Player kit, training top, and jacket orders from the public form. Download Excel for the full sheet."
      />
      <KitOrdersManager initialOrders={orders.map(serializeKitOrder)} />
    </PageContainer>
  );
}
