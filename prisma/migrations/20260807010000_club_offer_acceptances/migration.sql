-- CreateTable
CREATE TABLE "ClubOfferAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamSlug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "preferredKitNumber1" INTEGER NOT NULL,
    "preferredKitNumber2" INTEGER NOT NULL,
    "commitmentAccepted" BOOLEAN NOT NULL,
    "signatureDataUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ClubOfferAcceptance_teamSlug_createdAt_idx" ON "ClubOfferAcceptance"("teamSlug", "createdAt");

-- CreateIndex
CREATE INDEX "ClubOfferAcceptance_status_createdAt_idx" ON "ClubOfferAcceptance"("status", "createdAt");
