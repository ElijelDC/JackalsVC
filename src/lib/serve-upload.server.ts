import "server-only";

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { convertHeicBufferToJpeg } from "@/lib/image-normalize.server";
import {
  authorizeUploadAccess,
  isSensitiveUploadPath,
} from "@/lib/upload-access.server";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "public");
const UPLOADS_ROOT = path.join(DATA_DIR, "uploads");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".pdf": "application/pdf",
};

export async function serveUploadFile(
  relativePath: string,
  request: Request,
): Promise<NextResponse> {
  if (relativePath.includes("..") || relativePath.includes("~")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const allowed = await authorizeUploadAccess(relativePath, request);
  if (!allowed) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(UPLOADS_ROOT, relativePath);
  const resolved = path.resolve(filePath);

  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT))) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!existsSync(resolved)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  let contentType = MIME_TYPES[ext] || "application/octet-stream";
  let buffer = await readFile(resolved);

  if (ext === ".heic" || ext === ".heif") {
    buffer = Buffer.from(await convertHeicBufferToJpeg(buffer));
    contentType = "image/jpeg";
  }

  const sensitive = isSensitiveUploadPath(relativePath);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": sensitive
        ? "private, no-store"
        : "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
