import { existsSync } from "node:fs";
import path from "node:path";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export type AdminDocumentDefinition = {
  slug: string;
  title: string;
  description: string;
  filename: string;
};

export const LEGEA_PRODUCTS_STORE_DOCUMENT: AdminDocumentDefinition = {
  slug: "legea-products",
  title: "Legea products store",
  description: "Club kit catalog and Legea store order form — admin only.",
  filename: "leagea-store-order.pdf",
};

/** @deprecated Use LEGEA_PRODUCTS_STORE_DOCUMENT */
export const LEGEA_STORE_ORDER_DOCUMENT = LEGEA_PRODUCTS_STORE_DOCUMENT;

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export function adminDocumentRelativePath(document: AdminDocumentDefinition) {
  return `admin-docs/${document.filename}`;
}

export function adminDocumentUrl(document: AdminDocumentDefinition) {
  return `${PUBLIC_PATHS.uploads.adminDocs}/${document.filename}`;
}

export function adminDocumentExists(document: AdminDocumentDefinition) {
  return existsSync(
    path.join(UPLOADS_ROOT, "admin-docs", document.filename),
  );
}

export function adminDocumentPagePath(document: AdminDocumentDefinition) {
  return `/admin/${document.slug}`;
}
