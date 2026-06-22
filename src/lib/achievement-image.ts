import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { GALLERY_MAX_UPLOAD_BYTES } from "@/lib/gallery-upload-config";
import { PUBLIC_PATHS } from "@/lib/public-paths";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function validateAchievementImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please upload a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > GALLERY_MAX_UPLOAD_BYTES) {
    return "Image must be smaller than 5 MB.";
  }

  return null;
}

export function achievementImageUrl(filename: string) {
  return `${PUBLIC_PATHS.uploads.achievements}/${filename}`;
}

export async function saveAchievementImageFile(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type] ?? ".jpg";
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  const directory = path.join(
    process.cwd(),
    "public",
    PUBLIC_PATHS.uploads.achievements.slice(1),
  );

  await mkdir(directory, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);

  return achievementImageUrl(filename);
}

export async function deleteAchievementImageFile(
  imageUrl: string | null | undefined,
) {
  if (!imageUrl) return;

  const normalized = imageUrl.startsWith("/achievements/")
    ? imageUrl.replace(/^\/achievements\//, `${PUBLIC_PATHS.uploads.achievements}/`)
    : imageUrl;

  if (!normalized.startsWith(`${PUBLIC_PATHS.uploads.achievements}/`)) return;

  const filePath = path.join(process.cwd(), "public", normalized);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone.
  }
}
