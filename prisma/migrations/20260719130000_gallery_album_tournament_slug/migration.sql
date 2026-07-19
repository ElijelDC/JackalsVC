-- AlterTable
ALTER TABLE "GalleryAlbum" ADD COLUMN "tournamentSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GalleryAlbum_tournamentSlug_key" ON "GalleryAlbum"("tournamentSlug");
