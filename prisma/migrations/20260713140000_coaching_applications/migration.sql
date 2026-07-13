-- CreateTable
CREATE TABLE "CoachingApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "qualificationLevel" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "canCommuteToBothVenues" TEXT NOT NULL,
    "whyInterested" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "reviewedAt" DATETIME,
    "reviewedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CoachingApplication_status_createdAt_idx" ON "CoachingApplication"("status", "createdAt");
