-- CreateTable
CREATE TABLE "CommitteeInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "roleInterest1" TEXT NOT NULL,
    "roleInterest2" TEXT NOT NULL,
    "roleInterest3" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "reviewedAt" DATETIME,
    "reviewedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CommitteeInterest_status_createdAt_idx" ON "CommitteeInterest"("status", "createdAt");
