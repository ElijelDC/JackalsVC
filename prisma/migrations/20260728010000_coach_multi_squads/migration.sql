-- CreateTable
CREATE TABLE "ClubMemberCoachSquad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubMemberId" TEXT NOT NULL,
    "trainingTeamKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClubMemberCoachSquad_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClubMemberCoachSquad_clubMemberId_trainingTeamKey_key" ON "ClubMemberCoachSquad"("clubMemberId", "trainingTeamKey");

-- CreateIndex
CREATE INDEX "ClubMemberCoachSquad_trainingTeamKey_idx" ON "ClubMemberCoachSquad"("trainingTeamKey");

-- Backfill join rows from existing coach primary squads
INSERT INTO "ClubMemberCoachSquad" ("id", "clubMemberId", "trainingTeamKey", "createdAt")
SELECT lower(hex(randomblob(16))), "id", "trainingTeamKey", CURRENT_TIMESTAMP
FROM "ClubMember"
WHERE "rosterRole" = 'COACH'
  AND "trainingTeamKey" IS NOT NULL
  AND "trainingTeamKey" != '';

-- Allow the same club member on multiple public teams
DROP INDEX IF EXISTS "ClubTeamMember_clubMemberId_key";

CREATE UNIQUE INDEX "ClubTeamMember_teamId_clubMemberId_key" ON "ClubTeamMember"("teamId", "clubMemberId");
