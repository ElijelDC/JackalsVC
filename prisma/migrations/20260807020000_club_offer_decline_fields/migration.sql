-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClubOfferAcceptance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamSlug" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "preferredKitNumber1" INTEGER,
    "preferredKitNumber2" INTEGER,
    "commitmentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "signatureDataUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ClubOfferAcceptance" ("id", "teamSlug", "fullName", "phoneNumber", "email", "preferredKitNumber1", "preferredKitNumber2", "commitmentAccepted", "signatureDataUrl", "status", "createdAt", "updatedAt")
SELECT "id", "teamSlug", "fullName", "phoneNumber", "email", "preferredKitNumber1", "preferredKitNumber2", "commitmentAccepted", "signatureDataUrl",
  CASE WHEN "status" = 'NEW' OR "status" = '' THEN 'ACCEPTED' ELSE "status" END,
  "createdAt", "updatedAt"
FROM "ClubOfferAcceptance";
DROP TABLE "ClubOfferAcceptance";
ALTER TABLE "new_ClubOfferAcceptance" RENAME TO "ClubOfferAcceptance";
CREATE INDEX "ClubOfferAcceptance_teamSlug_createdAt_idx" ON "ClubOfferAcceptance"("teamSlug", "createdAt");
CREATE INDEX "ClubOfferAcceptance_status_createdAt_idx" ON "ClubOfferAcceptance"("status", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
