-- AlterTable
ALTER TABLE "KitOrder" ADD COLUMN "trainingTshirt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KitOrder" ADD COLUMN "trainingTshirtSize" TEXT NOT NULL DEFAULT '';
