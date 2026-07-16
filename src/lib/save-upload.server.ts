import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImageStoragePreset } from "@/lib/image-compress";
import {
  IMAGE_UPLOAD_TYPE_ERROR,
  validateImageFile,
} from "@/lib/image-upload-types";
import { prepareImageForStorage } from "@/lib/image-normalize.server";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "public");
const UPLOADS_ROOT = path.join(DATA_DIR, "uploads");

function managedUploadDir(...segments: string[]) {
  return path.join(UPLOADS_ROOT, ...segments);
}

function managedUploadPathFromUrl(imageUrl: string) {
  if (imageUrl.startsWith("/uploads/")) {
    return path.join(DATA_DIR, imageUrl.slice(1));
  }

  return path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
}

export async function saveManagedImageFile({
  file,
  preset,
  relativeDir,
  urlPrefix,
  buildFilename,
  maxBytes,
  sizeError,
}: {
  file: File;
  preset: ImageStoragePreset;
  relativeDir: string[];
  urlPrefix: string;
  buildFilename: (extension: string) => string;
  maxBytes: number;
  sizeError: string;
}): Promise<string> {
  const validationError = validateImageFile(file, { maxBytes, sizeError });
  if (validationError === IMAGE_UPLOAD_TYPE_ERROR) {
    throw new Error(`"${file.name}" is not supported. ${IMAGE_UPLOAD_TYPE_ERROR}`);
  }
  if (validationError) {
    throw new Error(`"${file.name}" ${validationError}`);
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  const { buffer, extension } = await prepareImageForStorage(rawBuffer, file, {
    preset,
  });
  const filename = buildFilename(extension);
  const directory = managedUploadDir(...relativeDir);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return `${urlPrefix}/${filename}`;
}

export async function deleteManagedUploadFile(
  imageUrl: string | null | undefined,
  urlPrefix: string,
) {
  if (!imageUrl?.startsWith(`${urlPrefix}/`)) return;

  try {
    await unlink(managedUploadPathFromUrl(imageUrl));
  } catch {
    // File may already be gone.
  }
}

export function randomUploadFilename(extension: string) {
  return `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
}

export async function saveManagedPdfFile({
  file,
  relativeDir,
  urlPrefix,
  buildFilename,
  maxBytes,
  sizeError,
}: {
  file: File;
  relativeDir: string[];
  urlPrefix: string;
  buildFilename: (extension: string) => string;
  maxBytes: number;
  sizeError: string;
}): Promise<string> {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) {
    throw new Error(`"${file.name}" must be a PDF file.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`"${file.name}" ${sizeError}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = buildFilename("pdf");
  const directory = managedUploadDir(...relativeDir);

  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), buffer);

  return `${urlPrefix}/${filename}`;
}
