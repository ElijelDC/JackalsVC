import { SpecialOrdersManager } from "@/components/admin/SpecialOrdersManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { prisma } from "@/lib/prisma";
import { serializeSpecialOrder } from "@/lib/special-order-response-config";

export const metadata = { title: "Special orders | Admin" };

export default async function AdminSpecialOrdersPage() {
  const orders = await prisma.specialOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  return (
    <PageContainer>
      <PageHeader
        title="Special orders"
        description="Warm-up T-shirt + match quarter zip package. Review orders and mark €15 payments as paid."
      />
      <SpecialOrdersManager
        initialOrders={orders.map(serializeSpecialOrder)}
      />
    </PageContainer>
  );
}
