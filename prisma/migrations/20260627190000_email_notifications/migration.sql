-- AlterTable
ALTER TABLE "User" ADD COLUMN "eventNewsletterOptOut" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "registrationContactEmail" TEXT;

-- CreateTable
CREATE TABLE "MembershipDueReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipDueReminder_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipDueReminder_paymentId_kind_key" ON "MembershipDueReminder"("paymentId", "kind");
