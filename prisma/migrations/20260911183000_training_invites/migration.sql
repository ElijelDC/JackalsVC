-- CreateTable
CREATE TABLE "TrainingInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL,
    "sessionFeeEur" REAL,
    "paymentUrl" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdByClubMemberId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingInviteSignup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" DATETIME,
    "reviewedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingInviteSignup_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "TrainingInvite" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingInvitePaymentProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteId" TEXT NOT NULL,
    "proofScreenshotUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signupId" TEXT,
    CONSTRAINT "TrainingInvitePaymentProof_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "TrainingInvite" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingInvitePaymentProof_signupId_fkey" FOREIGN KEY ("signupId") REFERENCES "TrainingInviteSignup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingInvite_token_key" ON "TrainingInvite"("token");

-- CreateIndex
CREATE INDEX "TrainingInvite_eventId_pricingType_status_idx" ON "TrainingInvite"("eventId", "pricingType", "status");

-- CreateIndex
CREATE INDEX "TrainingInvite_eventId_idx" ON "TrainingInvite"("eventId");

-- CreateIndex
CREATE INDEX "TrainingInvite_createdByUserId_idx" ON "TrainingInvite"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingInviteSignup_inviteId_email_key" ON "TrainingInviteSignup"("inviteId", "email");

-- CreateIndex
CREATE INDEX "TrainingInviteSignup_inviteId_status_idx" ON "TrainingInviteSignup"("inviteId", "status");

-- CreateIndex
CREATE INDEX "TrainingInviteSignup_status_createdAt_idx" ON "TrainingInviteSignup"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingInvitePaymentProof_signupId_key" ON "TrainingInvitePaymentProof"("signupId");

-- CreateIndex
CREATE INDEX "TrainingInvitePaymentProof_inviteId_createdAt_idx" ON "TrainingInvitePaymentProof"("inviteId", "createdAt");
