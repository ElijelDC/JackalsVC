import {
  PRESET_SETTINGS,
  type ImageStoragePreset,
} from "@/lib/image-storage-presets";
import { isHeicFilename, resolveImageMimeType } from "@/lib/image-upload-types";

function renameWithExtension(filename: string, extension: string) {
  const base = filename.replace(/\.[^.]+$/, "").trim() || "photo";
  return `${base}.${extension}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Resize + JPEG-encode in the browser before upload so less data hits the
 * network and the server can often store the file as-is.
 */
export async function compressImageFileForUpload(
  file: File,
  preset: ImageStoragePreset = "gallery",
): Promise<File> {
  const mime = resolveImageMimeType(file);
  if (mime === "image/gif") return file;
  if (
    mime === "image/heic" ||
    mime === "image/heif" ||
    isHeicFilename(file.name)
  ) {
    // Browsers generally cannot decode HEIC in canvas — server handles these.
    return file;
  }

  const { maxEdge, jpegQuality } = PRESET_SETTINGS[preset];
  const quality = jpegQuality / 100;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob) return file;

    // Keep the original when encoding barely helps and we did not resize.
    if (
      preset !== "receipt" &&
      scale === 1 &&
      blob.size >= file.size * 0.92 &&
      mime === "image/jpeg"
    ) {
      return file;
    }

    return new File([blob], renameWithExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

/** Run async work over items with a fixed concurrency limit. */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (completed: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let completed = 0;
  const workers = Math.min(Math.max(1, concurrency), items.length || 1);

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]!, index);
      completed += 1;
      onProgress?.(completed, items.length);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
