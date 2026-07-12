import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import { validateImageFile } from "@/lib/image-upload-types";
import {
  deleteManagedUploadFile,
  randomUploadFilename,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export function validateAchievementImageFile(file: File): string | null {
  return validateImageFile(file, {
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "Image must be smaller than 15 MB.",
  });
}

export function achievementImageUrl(filename: string) {
  return `${PUBLIC_PATHS.uploads.achievements}/${filename}`;
}

export async function saveAchievementImageFile(file: File): Promise<string> {
  return saveManagedImageFile({
    file,
    preset: "gallery",
    relativeDir: ["achievements"],
    urlPrefix: PUBLIC_PATHS.uploads.achievements,
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "exceeds the 15 MB limit.",
    buildFilename: (extension) => randomUploadFilename(extension),
  });
}

export async function deleteAchievementImageFile(
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) return;

  const normalized = imageUrl.startsWith("/achievements/")
    ? imageUrl.replace(/^\/achievements\//, `${PUBLIC_PATHS.uploads.achievements}/`)
    : imageUrl;

  await deleteManagedUploadFile(normalized, PUBLIC_PATHS.uploads.achievements);
}
