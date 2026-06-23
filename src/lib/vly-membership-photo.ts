import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_PATHS } from "@/lib/public-paths";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateVlyMembershipPhotoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please upload a JPEG, PNG, WebP, or GIF image.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "VLY membership photo must be smaller than 5 MB.";
  }

  return null;
}

function extensionForMime(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export function vlyMembershipPhotoUrl(memberId: string, filename: string) {
  return `${PUBLIC_PATHS.uploads.vlyMembershipPhotos}/${memberId}/${filename}`;
}

export async function saveVlyMembershipPhotoFile(
  memberId: string,
  file: File,
): Promise<string> {
  const extension = extensionForMime(file.type);
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${extension}`;
  const directory = path.join(
    process.cwd(),
    "public",
    PUBLIC_PATHS.uploads.vlyMembershipPhotos.slice(1),
    memberId,
  );

  await mkdir(directory, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);

  return vlyMembershipPhotoUrl(memberId, filename);
}

export async function deleteVlyMembershipPhotoFile(
  imageUrl: string | null | undefined,
) {
  if (!imageUrl?.startsWith(`${PUBLIC_PATHS.uploads.vlyMembershipPhotos}/`)) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", imageUrl);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone.
  }
}
