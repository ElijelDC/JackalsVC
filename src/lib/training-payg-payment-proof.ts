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

export function validateTrainingPaygProofFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: DOCUMENT_SCREENSHOT_SIZE_ERROR,
  });
}

export async function saveTrainingPaygProofFile(
  attendanceId: string,
  file: File,
): Promise<string> {
  return saveManagedImageFile({
    file,
    preset: "receipt",
    relativeDir: ["training-payg-proofs"],
    urlPrefix: PUBLIC_PATHS.uploads.trainingPaygProofs,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => `${attendanceId}-${Date.now()}.${extension}`,
  });
}

export async function deleteTrainingPaygProofFile(
  proofUrl: string,
): Promise<void> {
  await deleteManagedUploadFile(
    proofUrl,
    PUBLIC_PATHS.uploads.trainingPaygProofs,
  );
}
