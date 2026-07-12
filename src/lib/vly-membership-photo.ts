import {
  IMAGE_UPLOAD_MAX_5MB,
  validateImageFile,
} from "@/lib/image-upload-types";
import {
  deleteManagedUploadFile,
  randomUploadFilename,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function validateVlyMembershipPhotoFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "VLY membership photo must be smaller than 5 MB.",
  });
}

export function vlyMembershipPhotoUrl(memberId: string, filename: string) {
  return `${PUBLIC_PATHS.uploads.vlyMembershipPhotos}/${memberId}/${filename}`;
}

export async function saveVlyMembershipPhotoFile(
  memberId: string,
  file: File,
): Promise<string> {
  const urlPrefix = `${PUBLIC_PATHS.uploads.vlyMembershipPhotos}/${memberId}`;
  return saveManagedImageFile({
    file,
    preset: "document",
    relativeDir: ["vly-membership-photos", memberId],
    urlPrefix,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => randomUploadFilename(extension),
  });
}

export async function deleteVlyMembershipPhotoFile(
  imageUrl: string | null | undefined,
) {
  await deleteManagedUploadFile(
    imageUrl,
    PUBLIC_PATHS.uploads.vlyMembershipPhotos,
  );
}
