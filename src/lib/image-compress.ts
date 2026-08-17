import "server-only";

import convert from "heic-convert";
import sharp from "sharp";
import {
  PRESET_SETTINGS,
  type ImageStoragePreset,
} from "@/lib/image-storage-presets";
import { isHeicFilename, mimeFromFilename } from "@/lib/image-upload-types";

export type { ImageStoragePreset } from "@/lib/image-storage-presets";
export { PRESET_SETTINGS } from "@/lib/image-storage-presets";
export { mimeFromFilename } from "@/lib/image-upload-types";

async function decodeHeicToJpeg(input: Buffer): Promise<Buffer> {
  try {
    const converted = await convert({
      buffer: input,
      format: "JPEG",
      quality: 0.92,
    });
    return Buffer.from(converted);
  } catch {
    return sharp(input, { failOn: "none", unlimited: true })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
  }
}

function needsOrientationFix(orientation: number | undefined) {
  return orientation != null && orientation !== 1;
}

/**
 * If the browser already resized/encoded to gallery targets, store bytes as-is
 * (or only fix EXIF orientation) instead of a full mozjpeg re-encode.
 */
async function tryPassthroughOptimized(
  input: Buffer,
  preset: ImageStoragePreset,
): Promise<{ buffer: Buffer; extension: string } | null> {
  const { maxEdge, jpegQuality } = PRESET_SETTINGS[preset];
  const image = sharp(input, { failOn: "none", unlimited: true });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width <= 0 || height <= 0) return null;
  if (width > maxEdge || height > maxEdge) return null;

  const format = metadata.format;
  if (format === "jpeg") {
    if (!needsOrientationFix(metadata.orientation)) {
      return { buffer: input, extension: "jpg" };
    }
    return {
      buffer: await sharp(input, { failOn: "none", unlimited: true })
        .rotate()
        .jpeg({ quality: jpegQuality, mozjpeg: true })
        .toBuffer(),
      extension: "jpg",
    };
  }

  if (format === "webp") {
    if (!needsOrientationFix(metadata.orientation)) {
      return { buffer: input, extension: "webp" };
    }
    const { webpQuality } = PRESET_SETTINGS[preset];
    return {
      buffer: await sharp(input, { failOn: "none", unlimited: true })
        .rotate()
        .webp({ quality: webpQuality, effort: 4 })
        .toBuffer(),
      extension: "webp",
    };
  }

  return null;
}

export async function compressRasterImage(
  input: Buffer,
  mime: string,
  preset: ImageStoragePreset,
): Promise<{ buffer: Buffer; extension: string }> {
  if (mime === "image/gif" && preset !== "receipt") {
    return { buffer: input, extension: "gif" };
  }

  if (preset !== "receipt") {
    const passthrough = await tryPassthroughOptimized(input, preset);
    if (passthrough) return passthrough;
  }

  const { maxEdge, jpegQuality, webpQuality } = PRESET_SETTINGS[preset];
  const image = sharp(input, { failOn: "none", unlimited: true });
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const needsResize = width > maxEdge || height > maxEdge;

  let pipeline = image.rotate();
  if (needsResize) {
    pipeline = pipeline.resize(maxEdge, maxEdge, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (preset === "receipt") {
    if (metadata.hasAlpha) {
      pipeline = pipeline.flatten({ background: { r: 12, g: 12, b: 12 } });
    }
    return {
      buffer: await pipeline
        .jpeg({ quality: jpegQuality, mozjpeg: true })
        .toBuffer(),
      extension: "jpg",
    };
  }

  if (mime === "image/png" && metadata.hasAlpha) {
    return {
      buffer: await pipeline
        .webp({ quality: webpQuality, effort: 4, alphaQuality: webpQuality })
        .toBuffer(),
      extension: "webp",
    };
  }

  return {
    buffer: await pipeline
      .jpeg({ quality: jpegQuality, mozjpeg: true })
      .toBuffer(),
    extension: "jpg",
  };
}

/** Compress a file buffer using the same rules as upload normalization. */
export async function compressImageBuffer(
  input: Buffer,
  filename: string,
  preset: ImageStoragePreset,
): Promise<{ buffer: Buffer; extension: string }> {
  const mime = mimeFromFilename(filename);
  const decoded =
    mime === "image/heic" || mime === "image/heif" || isHeicFilename(filename)
      ? await decodeHeicToJpeg(input)
      : input;
  const outputMime =
    mime === "image/heic" || mime === "image/heif" || isHeicFilename(filename)
      ? "image/jpeg"
      : mime;
  return compressRasterImage(decoded, outputMime, preset);
}
