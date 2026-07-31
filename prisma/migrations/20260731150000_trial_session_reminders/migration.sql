-- CreateTable
CREATE TABLE "TrialSessionReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "signupId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrialSessionReminder_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "TrialSessionSignup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialSessionReminder_signupId_kind_key" ON "TrialSessionReminder"("signupId", "kind");

-- CreateIndex
CREATE INDEX "TrialSessionReminder_signupId_idx" ON "TrialSessionReminder"("signupId");
