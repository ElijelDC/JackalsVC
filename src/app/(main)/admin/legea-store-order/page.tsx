import { AdminDocumentPreview } from "@/components/admin/AdminDocumentPreview";
import { LEGEA_STORE_ORDER_DOCUMENT } from "@/lib/admin-documents";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata(LEGEA_STORE_ORDER_DOCUMENT.title);

export default function AdminLegeaStoreOrderPage() {
  return <AdminDocumentPreview document={LEGEA_STORE_ORDER_DOCUMENT} />;
}
