import { ACCEPTED_IMAGE_INPUT } from "@/lib/image-upload-types";

export const GALLERY_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/**
 * Max images per upload HTTP request. One file per request avoids Next.js
 * middleware body-clone truncation and keeps large album uploads reliable.
 */
export const GALLERY_MAX_BULK_FILES = 1;
/** Max images a user can queue in the uploader UI (uploaded in batched requests). */
export const GALLERY_MAX_SELECTION = 200;
/** Thumbnail previews shown in the queue (rest are listed by count only). */
export const GALLERY_MAX_PREVIEW_THUMBS = 36;
/** Parallel browser encodes before upload. */
export const GALLERY_CLIENT_COMPRESS_CONCURRENCY = 4;
/** Pause between single-file uploads (keep low for large albums). */
export const GALLERY_UPLOAD_BATCH_DELAY_MS = 50;

export const GALLERY_ACCEPTED_IMAGE_TYPES = ACCEPTED_IMAGE_INPUT;
