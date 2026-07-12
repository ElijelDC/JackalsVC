/**
 * One-off: compress existing upload files and update DB URLs when extensions change.
 *
 * Local:   npm run compress:uploads
 * Dry run: npm run compress:uploads -- --dry-run
 * Prod:    docker compose exec app npm run compress:uploads
 */
import { existsSync } from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import {
  compressImageBuffer,
  type ImageStoragePreset,
} from "../src/lib/image-compress";
import { GALLERY_PLACEHOLDER_COVER } from "../src/lib/gallery-config";
import { PrismaClient } from "../src/generated/prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const dryRun = process.argv.includes("--dry-run");

function getUploadsRoot() {
  const dataDir = process.env.DATA_DIR;
  if (dataDir) return path.join(dataDir, "uploads");
  return path.join(process.cwd(), "public", "uploads");
}

function isManagedUploadUrl(url: string | null | undefined): url is string {
  return Boolean(url?.startsWith("/uploads/"));
}

type ProcessResult = {
  skipped: boolean;
  savedBytes: number;
  newUrl?: string;
  reason?: string;
};

async function processUploadUrl(
  imageUrl: string,
  preset: ImageStoragePreset,
): Promise<ProcessResult> {
  const uploadsRoot = getUploadsRoot();
  const relativePath = imageUrl.slice("/uploads/".length);
  const filePath = path.join(uploadsRoot, relativePath);

  if (!existsSync(filePath)) {
    return { skipped: true, savedBytes: 0, reason: "file missing" };
  }

  const originalExt = path.extname(filePath).toLowerCase();
  if (originalExt === ".gif" || originalExt === ".pdf") {
    return { skipped: true, savedBytes: 0, reason: originalExt.slice(1) };
  }

  const original = await readFile(filePath);
  const { buffer, extension } = await compressImageBuffer(
    original,
    path.basename(filePath),
    preset,
  );

  const baseRelative = relativePath.replace(/\.[^.]+$/, "");
  const newRelativePath = `${baseRelative}.${extension}`;
  const newUrl = `/uploads/${newRelativePath}`;
  const savedBytes = original.length - buffer.length;
  const forceConvert =
    originalExt === ".heic" || originalExt === ".heif";

  if (!forceConvert && savedBytes <= 0) {
    return {
      skipped: true,
      savedBytes: 0,
      reason: "already optimized",
    };
  }

  if (dryRun) {
    return { skipped: false, savedBytes, newUrl };
  }

  const newFilePath = path.join(uploadsRoot, newRelativePath);
  await writeFile(newFilePath, buffer);

  if (newFilePath !== filePath) {
    try {
      await unlink(filePath);
    } catch {
      // Old file may already be gone.
    }
  }

  return {
    skipped: false,
    savedBytes,
    newUrl: newUrl === imageUrl ? undefined : newUrl,
  };
}

async function updateUrlField(
  label: string,
  imageUrl: string,
  preset: ImageStoragePreset,
  apply: (newUrl: string) => Promise<void>,
): Promise<ProcessResult> {
  const result = await processUploadUrl(imageUrl, preset);
  if (result.skipped) {
    if (result.reason && result.reason !== "already optimized") {
      console.log(`  skip ${label}: ${result.reason} (${imageUrl})`);
    }
    return result;
  }

  const finalUrl = result.newUrl ?? imageUrl;
  if (!dryRun && result.newUrl) {
    await apply(result.newUrl);
  }

  const savedKb = (result.savedBytes / 1024).toFixed(1);
  console.log(
    `  ${dryRun ? "[dry-run] " : ""}${label}: saved ${savedKb} KB${result.newUrl ? ` → ${finalUrl}` : ""}`,
  );
  return result;
}

async function main() {
  const uploadsRoot = getUploadsRoot();
  console.log(
    `${dryRun ? "Dry run — " : ""}Compressing uploads in ${uploadsRoot}`,
  );

  let processed = 0;
  let skipped = 0;
  let totalSaved = 0;
  let errors = 0;

  type UrlJob = {
    label: string;
    preset: ImageStoragePreset;
    apply: (newUrl: string) => Promise<void>;
  };

  const jobsByUrl = new Map<string, UrlJob[]>();

  const queue = (
    imageUrl: string,
    label: string,
    preset: ImageStoragePreset,
    apply: (newUrl: string) => Promise<void>,
  ) => {
    if (!isManagedUploadUrl(imageUrl)) return;
    const existing = jobsByUrl.get(imageUrl) ?? [];
    existing.push({ label, preset, apply });
    jobsByUrl.set(imageUrl, existing);
  };

  console.log("\nCollecting upload URLs from database…");

  for (const photo of await prisma.galleryPhoto.findMany({
    select: { id: true, imageUrl: true },
  })) {
    queue(photo.imageUrl, photo.imageUrl, "gallery", async (newUrl) => {
      await prisma.galleryPhoto.update({
        where: { id: photo.id },
        data: { imageUrl: newUrl },
      });
    });
  }

  for (const album of await prisma.galleryAlbum.findMany({
    select: { id: true, title: true, coverImageUrl: true },
  })) {
    if (album.coverImageUrl === GALLERY_PLACEHOLDER_COVER) continue;
    queue(album.coverImageUrl, `album "${album.title}"`, "gallery", async (newUrl) => {
      await prisma.galleryAlbum.update({
        where: { id: album.id },
        data: { coverImageUrl: newUrl },
      });
    });
  }

  for (const item of await prisma.achievement.findMany({
    select: { id: true, title: true, imageUrl: true },
  })) {
    if (!item.imageUrl) continue;
    queue(item.imageUrl, item.title, "gallery", async (newUrl) => {
      await prisma.achievement.update({
        where: { id: item.id },
        data: { imageUrl: newUrl },
      });
    });
  }

  for (const member of await prisma.clubMember.findMany({
    select: { id: true, name: true, profileImageUrl: true, vlyMembershipPhotoUrl: true },
  })) {
    if (member.profileImageUrl) {
      queue(member.profileImageUrl, `${member.name} profile`, "profile", async (newUrl) => {
        await prisma.clubMember.update({
          where: { id: member.id },
          data: { profileImageUrl: newUrl },
        });
      });
    }
    if (member.vlyMembershipPhotoUrl) {
      queue(
        member.vlyMembershipPhotoUrl,
        `${member.name} VLY photo`,
        "document",
        async (newUrl) => {
          await prisma.clubMember.update({
            where: { id: member.id },
            data: { vlyMembershipPhotoUrl: newUrl },
          });
        },
      );
    }
  }

  for (const member of await prisma.clubTeamMember.findMany({
    select: { id: true, name: true, photoUrl: true },
  })) {
    if (!member.photoUrl) continue;
    queue(member.photoUrl, `${member.name} team photo`, "profile", async (newUrl) => {
      await prisma.clubTeamMember.update({
        where: { id: member.id },
        data: { photoUrl: newUrl },
      });
    });
  }

  for (const product of await prisma.product.findMany({
    select: { id: true, name: true, imageUrl: true },
  })) {
    if (!product.imageUrl) continue;
    queue(product.imageUrl, product.name, "gallery", async (newUrl) => {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: newUrl },
      });
    });
  }

  for (const payment of await prisma.payment.findMany({
    select: { id: true, proofScreenshotUrl: true },
  })) {
    if (!payment.proofScreenshotUrl) continue;
    queue(payment.proofScreenshotUrl, payment.id, "document", async (newUrl) => {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { proofScreenshotUrl: newUrl },
      });
    });
  }

  for (const payment of await prisma.coachSalaryPayment.findMany({
    select: { id: true, invoiceScreenshotUrl: true },
  })) {
    if (!payment.invoiceScreenshotUrl) continue;
    queue(
      payment.invoiceScreenshotUrl,
      payment.id,
      "document",
      async (newUrl) => {
        await prisma.coachSalaryPayment.update({
          where: { id: payment.id },
          data: { invoiceScreenshotUrl: newUrl },
        });
      },
    );
  }

  console.log(`Found ${jobsByUrl.size} unique upload file(s).\n`);

  for (const [imageUrl, jobs] of jobsByUrl) {
    const label = jobs.map((job) => job.label).join(", ");
    const preset = jobs[0]!.preset;
    try {
      const result = await updateUrlField(label, imageUrl, preset, async (newUrl) => {
        for (const job of jobs) {
          await job.apply(newUrl);
        }
      });
      if (result.skipped) skipped += 1;
      else processed += 1;
      totalSaved += Math.max(0, result.savedBytes);
    } catch (error) {
      errors += 1;
      console.error(`  error ${label} (${imageUrl}):`, error);
    }
  }

  console.log("\nDone.");
  console.log(
    `Compressed: ${processed}, skipped: ${skipped}, errors: ${errors}, saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
