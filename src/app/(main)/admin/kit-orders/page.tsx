import { KitOrdersManager } from "@/components/admin/KitOrdersManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { isEmailConfigured } from "@/lib/email";
import { serializeKitOrder } from "@/lib/kit-order-response-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Kit orders | Admin" };

export default async function AdminKitOrdersPage() {
  const orders = await prisma.kitOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  const bank = getClubBankDetails();

  return (
    <PageContainer>
      <PageHeader
        title="Kit orders"
        description="Review orders, send payment details by email, and download Excel for the manufacturer."
      />
      <KitOrdersManager
        initialOrders={orders.map(serializeKitOrder)}
        emailConfigured={isEmailConfigured()}
        clubIban={bank.iban}
        clubAccountHolder={bank.accountHolder}
      />
    </PageContainer>
  );
}
