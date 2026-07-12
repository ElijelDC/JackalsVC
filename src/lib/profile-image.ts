import {
  IMAGE_UPLOAD_MAX_5MB,
  IMAGE_UPLOAD_TYPE_ERROR,
  validateImageFile,
} from "@/lib/image-upload-types";
import {
  deleteManagedUploadFile,
  randomUploadFilename,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function validateProfileImageFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "Profile image must be smaller than 5 MB.",
  });
}

export function profileImageUrl(memberId: string, filename: string) {
  return `${PUBLIC_PATHS.uploads.profileImages}/${memberId}/${filename}`;
}

export async function saveProfileImageFile(
  memberId: string,
  file: File,
): Promise<string> {
  const urlPrefix = `${PUBLIC_PATHS.uploads.profileImages}/${memberId}`;
  return saveManagedImageFile({
    file,
    preset: "profile",
    relativeDir: ["profile-images", memberId],
    urlPrefix,
    maxBytes: IMAGE_UPLOAD_MAX_5MB,
    sizeError: "must be smaller than 5 MB.",
    buildFilename: (extension) => randomUploadFilename(extension),
  });
}

export async function deleteProfileImageFile(imageUrl: string | null | undefined) {
  await deleteManagedUploadFile(
    imageUrl,
    `${PUBLIC_PATHS.uploads.profileImages}`,
  );
}
