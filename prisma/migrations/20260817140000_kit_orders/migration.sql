-- CreateTable
CREATE TABLE "KitOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "kitType" TEXT NOT NULL,
    "kitSize" TEXT NOT NULL,
    "preferredKitNumber1" INTEGER NOT NULL,
    "preferredKitNumber2" INTEGER NOT NULL,
    "trainingTop" BOOLEAN NOT NULL DEFAULT false,
    "trainingTopSize" TEXT NOT NULL DEFAULT '',
    "jacketHoodie" BOOLEAN NOT NULL DEFAULT false,
    "jacketHoodieSize" TEXT NOT NULL DEFAULT '',
    "jacketHighCollar" BOOLEAN NOT NULL DEFAULT false,
    "jacketHighCollarSize" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "KitOrder_createdAt_idx" ON "KitOrder"("createdAt");

-- CreateIndex
CREATE INDEX "KitOrder_gender_createdAt_idx" ON "KitOrder"("gender", "createdAt");

-- CreateIndex
CREATE INDEX "KitOrder_kitType_createdAt_idx" ON "KitOrder"("kitType", "createdAt");
