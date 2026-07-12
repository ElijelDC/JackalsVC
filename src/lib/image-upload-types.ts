export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

/** Value for `<input accept="...">` — includes extensions for iOS HEIC picks. */
export const ACCEPTED_IMAGE_INPUT =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

export const IMAGE_UPLOAD_TYPE_ERROR =
  "Please upload a JPEG, PNG, WebP, GIF, or HEIC image.";

export const IMAGE_UPLOAD_MAX_5MB = 5 * 1024 * 1024;

export const DOCUMENT_SCREENSHOT_SIZE_ERROR =
  "Screenshot must be smaller than 5 MB.";

export function isHeicFilename(filename: string): boolean {
  return /\.heic$/i.test(filename) || /\.heif$/i.test(filename);
}

/** Resolve MIME when browsers omit type (common for iPhone HEIC). */
export function resolveImageMimeType(
  file: Pick<File, "type" | "name">,
): string {
  const type = file.type.trim().toLowerCase();
  if (type && type !== "application/octet-stream") {
    return type;
  }
  if (isHeicFilename(file.name)) {
    return "image/heic";
  }
  return type;
}

export function isAcceptedImageFile(file: Pick<File, "type" | "name">): boolean {
  const mime = resolveImageMimeType(file);
  if ((IMAGE_MIME_TYPES as readonly string[]).includes(mime)) {
    return true;
  }
  return isHeicFilename(file.name);
}

export function validateImageFile(
  file: Pick<File, "type" | "name" | "size">,
  {
    maxBytes,
    sizeError,
  }: {
    maxBytes: number;
    sizeError: string;
  },
): string | null {
  if (!isAcceptedImageFile(file)) {
    return IMAGE_UPLOAD_TYPE_ERROR;
  }
  if (file.size > maxBytes) {
    return sizeError;
  }
  return null;
}
