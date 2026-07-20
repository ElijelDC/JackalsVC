/**
 * Generate missing gallery grid thumbnails for existing photos.
 *
 * Local:   npm run gallery:thumbs
 * Dry run: npm run gallery:thumbs -- --dry-run
 * Prod:    docker compose exec app npm run gallery:thumbs
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { compressRasterImage } from "../src/lib/image-compress";
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

function mimeFromExt(ext: string) {
  switch (ext.toLowerCase()) {
    case ".webp":
      return "image/webp";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

async function main() {
  const uploadsRoot = getUploadsRoot();
  const photos = await prisma.galleryPhoto.findMany({
    where: { OR: [{ thumbUrl: null }, { thumbUrl: "" }] },
    select: { id: true, imageUrl: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(
    `${dryRun ? "[dry-run] " : ""}Gallery photos missing thumbs: ${photos.length}`,
  );

  let created = 0;
  let skipped = 0;

  for (const photo of photos) {
    if (!photo.imageUrl.startsWith("/uploads/")) {
      skipped += 1;
      continue;
    }

    const relativePath = photo.imageUrl.slice("/uploads/".length);
    const filePath = path.join(uploadsRoot, relativePath);
    if (!existsSync(filePath)) {
      console.warn(`missing file: ${photo.imageUrl}`);
      skipped += 1;
      continue;
    }

    const ext = path.extname(filePath);
    if (ext.toLowerCase() === ".gif") {
      if (!dryRun) {
        await prisma.galleryPhoto.update({
          where: { id: photo.id },
          data: { thumbUrl: photo.imageUrl },
        });
      }
      created += 1;
      continue;
    }

    const original = await readFile(filePath);
    const thumb = await compressRasterImage(
      original,
      mimeFromExt(ext),
      "galleryThumb",
    );

    const dir = path.dirname(relativePath);
    const base = path.basename(relativePath, ext);
    const thumbRelative = path.join(dir, `${base}.thumb.${thumb.extension}`);
    const thumbPath = path.join(uploadsRoot, thumbRelative);
    const thumbUrl = `/uploads/${thumbRelative.replace(/\\/g, "/")}`;

    if (dryRun) {
      console.log(`would create ${thumbUrl} (${thumb.buffer.length} bytes)`);
      created += 1;
      continue;
    }

    await mkdir(path.dirname(thumbPath), { recursive: true });
    await writeFile(thumbPath, thumb.buffer);
    await prisma.galleryPhoto.update({
      where: { id: photo.id },
      data: { thumbUrl },
    });
    created += 1;
  }

  console.log(`Done. thumbs=${created} skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
