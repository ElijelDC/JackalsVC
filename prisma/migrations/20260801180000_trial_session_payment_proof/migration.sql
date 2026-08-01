-- CreateTable
CREATE TABLE "TrialSessionPaymentProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trialSessionId" TEXT NOT NULL,
    "proofScreenshotUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signupId" TEXT,
    CONSTRAINT "TrialSessionPaymentProof_trialSessionId_fkey" FOREIGN KEY ("trialSessionId") REFERENCES "TrialSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrialSessionPaymentProof_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "TrialSessionSignup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialSessionPaymentProof_signupId_key" ON "TrialSessionPaymentProof"("signupId");

-- CreateIndex
CREATE INDEX "TrialSessionPaymentProof_trialSessionId_createdAt_idx" ON "TrialSessionPaymentProof"("trialSessionId", "createdAt");
