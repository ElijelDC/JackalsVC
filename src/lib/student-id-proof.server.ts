import "server-only";

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

export function validateStudentIdProofFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export async function saveStudentIdProofFile(
  userId: string,
  file: File,
): Promise<string> {
  return saveManagedImageFile({
    file,
    preset: "document",
    relativeDir: ["student-id-proofs"],
    urlPrefix: PUBLIC_PATHS.uploads.studentIdProofs,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${userId}-${Date.now()}.${extension}`,
  });
}

export async function deleteStudentIdProofFile(proofUrl: string): Promise<void> {
  await deleteManagedUploadFile(proofUrl, PUBLIC_PATHS.uploads.studentIdProofs);
}
