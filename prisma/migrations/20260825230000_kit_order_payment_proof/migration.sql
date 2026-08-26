-- Kit order payment page token + proof upload
ALTER TABLE "KitOrder" ADD COLUMN "paymentToken" TEXT;
ALTER TABLE "KitOrder" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'AWAITING';
ALTER TABLE "KitOrder" ADD COLUMN "proofScreenshotUrl" TEXT;
ALTER TABLE "KitOrder" ADD COLUMN "proofSubmittedAt" DATETIME;
ALTER TABLE "KitOrder" ADD COLUMN "paymentEmailSentAt" DATETIME;

UPDATE "KitOrder"
SET "paymentToken" = lower(hex(randomblob(16)))
WHERE "paymentToken" IS NULL;

CREATE UNIQUE INDEX "KitOrder_paymentToken_key" ON "KitOrder"("paymentToken");
CREATE INDEX "KitOrder_paymentStatus_createdAt_idx" ON "KitOrder"("paymentStatus", "createdAt");
