-- CreateTable
CREATE TABLE "TrialsApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tryingOutFor" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "yearsExperience" INTEGER NOT NULL,
    "inlDivision" TEXT NOT NULL,
    "inlDivisionOther" TEXT,
    "inlTeamName" TEXT,
    "preferredPosition1" TEXT NOT NULL,
    "preferredPosition2" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "reviewedAt" DATETIME,
    "reviewedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TrialsApplication_status_createdAt_idx" ON "TrialsApplication"("status", "createdAt");
