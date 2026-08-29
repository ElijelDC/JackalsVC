-- Make ClubMember.vlyNumber optional (members/coaches can add VLY/VLYC later).
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_ClubMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vlyNumber" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "rosterRole" TEXT NOT NULL DEFAULT 'PLAYER',
    "coachPaymentType" TEXT,
    "trainingTeamKey" TEXT,
    "profileImageUrl" TEXT,
    "vlyMembershipPhotoUrl" TEXT,
    "playerNumber" INTEGER,
    "registrationContactEmail" TEXT,
    "registrationReviewStatus" TEXT,
    "registrationPhotoSubmittedAt" DATETIME,
    "registrationReviewedAt" DATETIME,
    "registrationReviewedByUserId" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_ClubMember" (
    "id",
    "vlyNumber",
    "name",
    "active",
    "rosterRole",
    "coachPaymentType",
    "trainingTeamKey",
    "profileImageUrl",
    "vlyMembershipPhotoUrl",
    "playerNumber",
    "registrationContactEmail",
    "registrationReviewStatus",
    "registrationPhotoSubmittedAt",
    "registrationReviewedAt",
    "registrationReviewedByUserId",
    "userId",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "vlyNumber",
    "name",
    "active",
    "rosterRole",
    "coachPaymentType",
    "trainingTeamKey",
    "profileImageUrl",
    "vlyMembershipPhotoUrl",
    "playerNumber",
    "registrationContactEmail",
    "registrationReviewStatus",
    "registrationPhotoSubmittedAt",
    "registrationReviewedAt",
    "registrationReviewedByUserId",
    "userId",
    "createdAt",
    "updatedAt"
FROM "ClubMember";

DROP TABLE "ClubMember";
ALTER TABLE "new_ClubMember" RENAME TO "ClubMember";

CREATE UNIQUE INDEX "ClubMember_vlyNumber_key" ON "ClubMember"("vlyNumber");
CREATE UNIQUE INDEX "ClubMember_userId_key" ON "ClubMember"("userId");

PRAGMA foreign_keys=ON;
