-- CreateTable
CREATE TABLE "MerchandiseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL,
    "trainingTshirt" BOOLEAN NOT NULL DEFAULT false,
    "trainingTshirtSize" TEXT NOT NULL DEFAULT '',
    "trainingTop" BOOLEAN NOT NULL DEFAULT false,
    "trainingTopSize" TEXT NOT NULL DEFAULT '',
    "jacketHoodie" BOOLEAN NOT NULL DEFAULT false,
    "jacketHoodieSize" TEXT NOT NULL DEFAULT '',
    "jacketHighCollar" BOOLEAN NOT NULL DEFAULT false,
    "jacketHighCollarSize" TEXT NOT NULL DEFAULT '',
    "jacketFullZip" BOOLEAN NOT NULL DEFAULT false,
    "jacketFullZipSize" TEXT NOT NULL DEFAULT '',
    "freeLineItemIds" TEXT NOT NULL DEFAULT '[]',
    "paymentToken" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'AWAITING',
    "proofScreenshotUrl" TEXT,
    "proofSubmittedAt" DATETIME,
    "paymentEmailSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- AlterTable
ALTER TABLE "PaymentImportRecord" ADD COLUMN "matchedMerchandiseOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MerchandiseOrder_paymentToken_key" ON "MerchandiseOrder"("paymentToken");

-- CreateIndex
CREATE INDEX "MerchandiseOrder_createdAt_idx" ON "MerchandiseOrder"("createdAt");

-- CreateIndex
CREATE INDEX "MerchandiseOrder_gender_createdAt_idx" ON "MerchandiseOrder"("gender", "createdAt");

-- CreateIndex
CREATE INDEX "MerchandiseOrder_paymentStatus_createdAt_idx" ON "MerchandiseOrder"("paymentStatus", "createdAt");
