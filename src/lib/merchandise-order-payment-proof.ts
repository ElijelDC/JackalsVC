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

export function validateMerchandiseOrderProofFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export function saveMerchandiseOrderProofFile(orderId: string, file: File) {
  return saveManagedImageFile({
    file,
    preset: "receipt",
    relativeDir: ["merchandise-order-proofs"],
    urlPrefix: PUBLIC_PATHS.uploads.merchandiseOrderProofs,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${orderId}-${Date.now()}.${extension}`,
  });
}

export async function deleteMerchandiseOrderProofFile(proofUrl: string) {
  await deleteManagedUploadFile(
    proofUrl,
    PUBLIC_PATHS.uploads.merchandiseOrderProofs,
  );
}
