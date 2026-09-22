-- CreateTable
CREATE TABLE "SpecialOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "tshirtSize" TEXT NOT NULL,
    "quarterZipSize" TEXT NOT NULL,
    "paymentToken" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'AWAITING',
    "proofScreenshotUrl" TEXT,
    "proofSubmittedAt" DATETIME,
    "paymentEmailSentAt" DATETIME,
    "dueDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SpecialOrder_paymentToken_key" ON "SpecialOrder"("paymentToken");

-- CreateIndex
CREATE INDEX "SpecialOrder_createdAt_idx" ON "SpecialOrder"("createdAt");

-- CreateIndex
CREATE INDEX "SpecialOrder_paymentStatus_createdAt_idx" ON "SpecialOrder"("paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "SpecialOrder_dueDate_idx" ON "SpecialOrder"("dueDate");
