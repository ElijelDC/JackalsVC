import "server-only";

import {
  compressImageBuffer,
  compressRasterImage,
  type ImageStoragePreset,
} from "@/lib/image-compress";
import {
  isHeicFilename,
  resolveImageMimeType,
} from "@/lib/image-upload-types";

export type { ImageStoragePreset } from "@/lib/image-compress";

export function isHeicUpload(file: Pick<File, "type" | "name">): boolean {
  const mime = resolveImageMimeType(file);
  return (
    mime === "image/heic" ||
    mime === "image/heif" ||
    isHeicFilename(file.name)
  );
}

/** Normalize uploads: HEIC → web-safe format, gentle resize + compression. */
export async function prepareImageForStorage(
  input: Buffer,
  file: Pick<File, "type" | "name">,
  options: { preset?: ImageStoragePreset } = {},
): Promise<{ buffer: Buffer; extension: string }> {
  return compressImageBuffer(input, file.name, options.preset ?? "gallery");
}

/** On-the-fly HEIC serve path (legacy files stored as .heic). */
export async function convertHeicBufferToJpeg(input: Buffer): Promise<Buffer> {
  const { buffer } = await compressImageBuffer(input, "legacy.heic", "gallery");
  return buffer;
}

// Re-export for serve path if needed elsewhere
export { compressRasterImage };
