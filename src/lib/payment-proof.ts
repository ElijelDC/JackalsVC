import {
  DOCUMENT_SCREENSHOT_SIZE_ERROR,
  IMAGE_UPLOAD_MAX_5MB,
  validateImageFile,
} from "@/lib/image-upload-types";
import {
  deleteManagedUploadFile,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function validateProofFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export async function savePaymentProofFile(
  paymentId: string,
  file: File,
): Promise<string> {
  return saveManagedImageFile({
    file,
    preset: "document",
    relativeDir: ["payment-proofs"],
    urlPrefix: PUBLIC_PATHS.uploads.paymentProofs,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${paymentId}-${Date.now()}.${extension}`,
  });
}

export async function deletePaymentProofFile(proofUrl: string): Promise<void> {
  await deleteManagedUploadFile(proofUrl, PUBLIC_PATHS.uploads.paymentProofs);
}

export function validateCoachInvoiceFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export async function saveCoachInvoiceFile(
  paymentId: string,
  file: File,
): Promise<string> {
  return saveManagedImageFile({
    file,
    preset: "document",
    relativeDir: ["coach-invoices"],
    urlPrefix: PUBLIC_PATHS.uploads.coachInvoices,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${paymentId}-${Date.now()}.${extension}`,
  });
}

export async function deleteCoachInvoiceFile(invoiceUrl: string): Promise<void> {
  await deleteManagedUploadFile(invoiceUrl, PUBLIC_PATHS.uploads.coachInvoices);
}
