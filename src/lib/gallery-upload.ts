import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import { galleryImageUrl, PUBLIC_PATHS } from "@/lib/public-paths";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export { GALLERY_MAX_BULK_FILES, GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";

export function isGalleryImageFile(file: File) {
  return ALLOWED_TYPES.has(file.type);
}

export async function saveGalleryImageFile(file: File, albumId: string) {
  if (!isGalleryImageFile(file)) {
    throw new Error(
      `"${file.name}" is not supported. Use JPEG, PNG, WebP, or GIF.`,
    );
  }

  if (file.size > GALLERY_MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" exceeds the 5 MB limit.`);
  }

  const ext = EXT_BY_TYPE[file.type] ?? ".jpg";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const dir = path.join(
    process.cwd(),
    "public",
    PUBLIC_PATHS.uploads.gallery.slice(1),
    albumId,
  );

  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return galleryImageUrl(albumId, filename);
}

export function photoTitleFromFilename(filename: string) {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return base || undefined;
}
