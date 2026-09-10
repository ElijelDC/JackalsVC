-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "playerPaymentType" TEXT NOT NULL DEFAULT 'MEMBERSHIP';

-- CreateTable
CREATE TABLE "TrainingPaygSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "sessionFeeEur" REAL NOT NULL DEFAULT 10,
    "paymentUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingPaygAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubMemberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "amountDue" REAL NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AWAITING_PROOF',
    "proofScreenshotUrl" TEXT,
    "aiDecision" TEXT,
    "aiRawAmount" REAL,
    "aiNotes" TEXT,
    "reviewedAt" DATETIME,
    "reviewedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingPaygAttendance_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingPaygAttendance_userId_eventId_key" ON "TrainingPaygAttendance"("userId", "eventId");

-- CreateIndex
CREATE INDEX "TrainingPaygAttendance_status_createdAt_idx" ON "TrainingPaygAttendance"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TrainingPaygAttendance_clubMemberId_idx" ON "TrainingPaygAttendance"("clubMemberId");

-- CreateIndex
CREATE INDEX "TrainingPaygAttendance_eventId_idx" ON "TrainingPaygAttendance"("eventId");

-- Seed singleton settings row
INSERT INTO "TrainingPaygSettings" ("id", "sessionFeeEur", "paymentUrl", "active", "updatedAt")
VALUES ('default', 10, '', true, CURRENT_TIMESTAMP);
