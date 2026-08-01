-- AlterTable
ALTER TABLE "TrialSessionSignup" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

-- Existing signups were auto-approved before this workflow existed.
UPDATE "TrialSessionSignup" SET "status" = 'APPROVED';

-- CreateIndex
CREATE INDEX "TrialSessionSignup_trialSessionId_status_idx" ON "TrialSessionSignup"("trialSessionId", "status");
