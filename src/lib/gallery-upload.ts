import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compressRasterImage } from "@/lib/image-compress";
import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import {
  IMAGE_UPLOAD_TYPE_ERROR,
  isAcceptedImageFile,
  validateImageFile,
} from "@/lib/image-upload-types";
import { prepareImageForStorage } from "@/lib/image-normalize.server";
import {
  deleteManagedUploadFile,
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

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "public");
const UPLOADS_ROOT = path.join(DATA_DIR, "uploads");

export function isGalleryImageFile(file: File) {
  return isAcceptedImageFile(file);
}

/** @deprecated Prefer saveGalleryImagePair for new uploads. */
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

export async function saveGalleryImagePair(
  file: File,
  albumId: string,
): Promise<{ imageUrl: string; thumbUrl: string }> {
  const validationError = validateImageFile(file, {
    maxBytes: GALLERY_MAX_UPLOAD_BYTES,
    sizeError: "exceeds the 15 MB limit.",
  });
  if (validationError === IMAGE_UPLOAD_TYPE_ERROR) {
    throw new Error(
      `"${file.name}" is not supported. ${IMAGE_UPLOAD_TYPE_ERROR}`,
    );
  }
  if (validationError) {
    throw new Error(`"${file.name}" ${validationError}`);
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const full = await prepareImageForStorage(rawBuffer, file, {
    preset: "gallery",
  });

  const directory = path.join(UPLOADS_ROOT, "gallery", albumId);
  await mkdir(directory, { recursive: true });

  const stem = `${Date.now()}-${randomBytes(4).toString("hex")}`;
  const fullFilename = `${stem}.${full.extension}`;
  await writeFile(path.join(directory, fullFilename), full.buffer);

  const urlPrefix = `${PUBLIC_PATHS.uploads.gallery}/${albumId}`;
  const imageUrl = `${urlPrefix}/${fullFilename}`;

  if (full.extension === "gif") {
    return { imageUrl, thumbUrl: imageUrl };
  }

  const thumbSourceMime =
    full.extension === "webp" ? "image/webp" : "image/jpeg";
  const thumb = await compressRasterImage(
    full.buffer,
    thumbSourceMime,
    "galleryThumb",
  );
  const thumbFilename = `${stem}.thumb.${thumb.extension}`;
  await writeFile(path.join(directory, thumbFilename), thumb.buffer);

  return {
    imageUrl,
    thumbUrl: `${urlPrefix}/${thumbFilename}`,
  };
}

export async function deleteGalleryPhotoFiles(
  imageUrl: string,
  thumbUrl: string | null | undefined,
  albumId: string,
) {
  const urlPrefix = `${PUBLIC_PATHS.uploads.gallery}/${albumId}`;
  await deleteManagedUploadFile(imageUrl, urlPrefix);
  if (thumbUrl && thumbUrl !== imageUrl) {
    await deleteManagedUploadFile(thumbUrl, urlPrefix);
  }
}

export function photoTitleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || undefined;
}
