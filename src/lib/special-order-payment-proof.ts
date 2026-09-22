import {
  DOCUMENT_SCREENSHOT_SIZE_ERROR,
  IMAGE_UPLOAD_MAX_5MB,
  validateImageFile,
} from "@/lib/image-upload-types";
import { PUBLIC_PATHS } from "@/lib/public-paths";
import {
  deleteManagedUploadFile,
  saveManagedImageFile,
} from "@/lib/save-upload.server";

export function validateSpecialOrderProofFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export function saveSpecialOrderProofFile(orderId: string, file: File) {
  return saveManagedImageFile({
    file,
    preset: "receipt",
    relativeDir: ["special-order-proofs"],
    urlPrefix: PUBLIC_PATHS.uploads.specialOrderProofs,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${orderId}-${Date.now()}.${extension}`,
  });
}

export async function deleteSpecialOrderProofFile(proofUrl: string) {
  await deleteManagedUploadFile(
    proofUrl,
    PUBLIC_PATHS.uploads.specialOrderProofs,
  );
}
