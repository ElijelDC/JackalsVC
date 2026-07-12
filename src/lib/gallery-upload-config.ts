import { ACCEPTED_IMAGE_INPUT } from "@/lib/image-upload-types";

export const GALLERY_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** Max images per upload request (kept small to limit memory and request time). */
export const GALLERY_MAX_BULK_FILES = 8;
/** Max images a user can queue in the uploader UI. */
export const GALLERY_MAX_SELECTION = 50;
/** Pause between upload batches to avoid overloading the server. */
export const GALLERY_UPLOAD_BATCH_DELAY_MS = 2000;

export const GALLERY_ACCEPTED_IMAGE_TYPES = ACCEPTED_IMAGE_INPUT;
