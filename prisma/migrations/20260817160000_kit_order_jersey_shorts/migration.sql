-- AlterTable
ALTER TABLE "KitOrder" ADD COLUMN "playerJersey" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KitOrder" ADD COLUMN "playerShorts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KitOrder" ADD COLUMN "liberoJersey" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KitOrder" ADD COLUMN "liberoShorts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KitOrder" ADD COLUMN "jerseySize" TEXT NOT NULL DEFAULT '';
ALTER TABLE "KitOrder" ADD COLUMN "shortsSize" TEXT NOT NULL DEFAULT '';

UPDATE "KitOrder"
SET
  "playerJersey" = CASE WHEN "kitType" IN ('player', 'both') THEN 1 ELSE 0 END,
  "playerShorts" = CASE WHEN "kitType" IN ('player', 'both') THEN 1 ELSE 0 END,
  "liberoJersey" = CASE WHEN "kitType" IN ('libero', 'both') THEN 1 ELSE 0 END,
  "liberoShorts" = CASE WHEN "kitType" IN ('libero', 'both') THEN 1 ELSE 0 END,
  "jerseySize" = "kitSize",
  "shortsSize" = "kitSize";
