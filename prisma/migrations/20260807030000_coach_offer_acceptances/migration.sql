-- CreateTable
CREATE TABLE "CoachOfferAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamSlug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "commitmentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "signatureDataUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "CoachOfferAcceptance_teamSlug_createdAt_idx" ON "CoachOfferAcceptance"("teamSlug", "createdAt");

-- CreateIndex
CREATE INDEX "CoachOfferAcceptance_status_createdAt_idx" ON "CoachOfferAcceptance"("status", "createdAt");
