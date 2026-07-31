-- CreateTable
CREATE TABLE "TrialSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "location" TEXT,
    "price" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrialSessionSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trialSessionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrialSessionSignup_trialSessionId_fkey" FOREIGN KEY ("trialSessionId") REFERENCES "TrialSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialSession_slug_key" ON "TrialSession"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TrialSessionSignup_trialSessionId_email_key" ON "TrialSessionSignup"("trialSessionId", "email");

-- CreateIndex
CREATE INDEX "TrialSessionSignup_trialSessionId_createdAt_idx" ON "TrialSessionSignup"("trialSessionId", "createdAt");
