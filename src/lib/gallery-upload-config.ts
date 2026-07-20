import { ACCEPTED_IMAGE_INPUT } from "@/lib/image-upload-types";

export const GALLERY_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Max images per upload request (smaller payloads after client compress). */
export const GALLERY_MAX_BULK_FILES = 20;
/** Max images a user can queue in the uploader UI (uploaded in batched requests). */
export const GALLERY_MAX_SELECTION = 200;
/** Thumbnail previews shown in the queue (rest are listed by count only). */
export const GALLERY_MAX_PREVIEW_THUMBS = 36;
/** Parallel browser encodes before upload. */
export const GALLERY_CLIENT_COMPRESS_CONCURRENCY = 4;
/** Pause between upload batches to avoid overloading the server. */
export const GALLERY_UPLOAD_BATCH_DELAY_MS = 100;

export const GALLERY_ACCEPTED_IMAGE_TYPES = ACCEPTED_IMAGE_INPUT;
