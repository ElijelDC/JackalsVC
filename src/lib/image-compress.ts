import convert from "heic-convert";
import path from "node:path";
import sharp from "sharp";
import { isHeicFilename } from "@/lib/image-upload-types";

/** Tuned for visible quality — resize only when very large, high encode quality. */
export type ImageStoragePreset = "gallery" | "profile" | "document";

export const PRESET_SETTINGS = {
  /** Full-screen gallery lightbox — cap pixel count, keep detail. */
  gallery: { maxEdge: 2560, jpegQuality: 88, webpQuality: 90 },
  /** Faces and avatars — slightly higher quality, moderate max size. */
  profile: { maxEdge: 1600, jpegQuality: 90, webpQuality: 92 },
  /** Payment proofs, IDs — preserve text legibility. */
  document: { maxEdge: 2400, jpegQuality: 90, webpQuality: 92 },
} as const;

export function mimeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".heic":
    case ".heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}

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

export async function compressRasterImage(
  input: Buffer,
  mime: string,
  preset: ImageStoragePreset,
): Promise<{ buffer: Buffer; extension: string }> {
  if (mime === "image/gif") {
    return { buffer: input, extension: "gif" };
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
