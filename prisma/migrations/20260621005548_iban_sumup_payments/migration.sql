/*
  Warnings:

  - Added the required column `paymentReference` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "membershipId" TEXT,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "paymentReference" TEXT NOT NULL,
    "installmentNumber" INTEGER,
    "dueDate" DATETIME,
    "paidAt" DATETIME,
    "sumupTransactionId" TEXT,
    "sumupTransactionCode" TEXT,
    "sumupMatchedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "description", "dueDate", "id", "installmentNumber", "membershipId", "method", "paidAt", "status", "userId") SELECT "amount", "createdAt", "description", "dueDate", "id", "installmentNumber", "membershipId", "method", "paidAt", "status", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_paymentReference_key" ON "Payment"("paymentReference");
CREATE INDEX "Payment_status_dueDate_idx" ON "Payment"("status", "dueDate");
CREATE INDEX "Payment_sumupTransactionId_idx" ON "Payment"("sumupTransactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
