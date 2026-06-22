import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_PATHS } from "@/lib/public-paths";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function validateProofFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please upload a screenshot (JPEG, PNG, or WebP).";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Screenshot must be smaller than 5 MB.";
  }

  return null;
}

function extensionForMime(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    default:
      return "jpg";
  }
}

export async function savePaymentProofFile(
  paymentId: string,
  file: File,
): Promise<string> {
  const extension = extensionForMime(file.type);
  const filename = `${paymentId}-${Date.now()}.${extension}`;
  const directory = path.join(
    process.cwd(),
    "public",
    PUBLIC_PATHS.uploads.paymentProofs.slice(1),
  );
  await mkdir(directory, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(directory, filename), buffer);

  return `${PUBLIC_PATHS.uploads.paymentProofs}/${filename}`;
}

export async function deletePaymentProofFile(proofUrl: string): Promise<void> {
  if (!proofUrl.startsWith(`${PUBLIC_PATHS.uploads.paymentProofs}/`)) return;

  const filePath = path.join(process.cwd(), "public", proofUrl);
  try {
    await unlink(filePath);
  } catch {
    // File may already be gone — clearing the DB record is enough.
  }
}
