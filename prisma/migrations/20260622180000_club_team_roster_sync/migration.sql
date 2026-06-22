-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "rosterRole" TEXT NOT NULL DEFAULT 'PLAYER';

-- AlterTable
ALTER TABLE "ClubTeam" ADD COLUMN "trainingTeamKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClubTeam_trainingTeamKey_key" ON "ClubTeam"("trainingTeamKey");

-- AlterTable
ALTER TABLE "ClubTeamMember" ADD COLUMN "clubMemberId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClubTeamMember_clubMemberId_key" ON "ClubTeamMember"("clubMemberId");
