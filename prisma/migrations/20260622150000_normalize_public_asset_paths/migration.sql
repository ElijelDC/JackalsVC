-- Normalize legacy public asset paths after uploads/ reorganisation.
UPDATE "Achievement"
SET "imageUrl" = REPLACE("imageUrl", '/achievements/', '/uploads/achievements/')
WHERE "imageUrl" LIKE '/achievements/%';

UPDATE "GalleryPhoto"
SET "imageUrl" = REPLACE("imageUrl", '/gallery/', '/uploads/gallery/')
WHERE "imageUrl" LIKE '/gallery/%';

UPDATE "GalleryAlbum"
SET "coverImageUrl" = REPLACE("coverImageUrl", '/gallery/', '/uploads/gallery/')
WHERE "coverImageUrl" LIKE '/gallery/%';
