import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import { isAcceptedImageFile } from "@/lib/image-upload-types";
import {
  randomUploadFilename,
  saveManagedImageFile,
} from "@/lib/save-upload.server";
import { PUBLIC_PATHS } from "@/lib/public-paths";

export {
  GALLERY_MAX_BULK_FILES,
  GALLERY_MAX_SELECTION,
  GALLERY_MAX_UPLOAD_BYTES,
  GALLERY_UPLOAD_BATCH_DELAY_MS,
} from "@/lib/gallery-upload-config";

export function isGalleryImageFile(file: File) {
  return isAcceptedImageFile(file);
}

export async function saveGalleryImageFile(file: File, albumId: string) {
  const urlPrefix = `${PUBLIC_PATHS.uploads.gallery}/${albumId}`;
  return saveManagedImageFile({
    file,
    preset: "gallery",
    relativeDir: ["gallery", albumId],
    urlPrefix,
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "exceeds the 15 MB limit.",
    buildFilename: (extension) => randomUploadFilename(extension),
  });
}

export function photoTitleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || undefined;
}
