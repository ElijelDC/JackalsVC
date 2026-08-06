import { AdminDocumentPreview } from "@/components/admin/AdminDocumentPreview";
import { LEGEA_PRODUCTS_STORE_DOCUMENT } from "@/lib/admin-documents";
import { adminPageMetadata } from "@/lib/seo";

export const metadata = adminPageMetadata(LEGEA_PRODUCTS_STORE_DOCUMENT.title);

export default function AdminLegeaProductsPage() {
  return <AdminDocumentPreview document={LEGEA_PRODUCTS_STORE_DOCUMENT} />;
}
