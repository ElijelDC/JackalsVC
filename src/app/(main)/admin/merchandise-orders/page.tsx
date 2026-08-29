import { MerchandiseOrdersManager } from "@/components/admin/MerchandiseOrdersManager";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { isEmailConfigured } from "@/lib/email";
import { serializeMerchandiseOrder } from "@/lib/merchandise-order-response-config";
import { getClubBankDetails } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Merchandise payments | Admin" };

export default async function AdminMerchandiseOrdersPage() {
  const orders = await prisma.merchandiseOrder.findMany({
    orderBy: { createdAt: "desc" },
  });
  const bank = getClubBankDetails();
  return (
    <PageContainer>
      <PageHeader
        title="Merchandise payments"
        description="Review merchandise orders, send payment details, approve receipts, and export Excel."
      />
      <MerchandiseOrdersManager
        initialOrders={orders.map(serializeMerchandiseOrder)}
        emailConfigured={isEmailConfigured()}
        clubIban={bank.iban}
        clubAccountHolder={bank.accountHolder}
      />
    </PageContainer>
  );
}
