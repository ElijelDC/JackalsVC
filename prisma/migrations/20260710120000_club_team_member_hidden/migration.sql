-- AlterTable
ALTER TABLE "ClubTeam" ADD COLUMN "syncExcludedClubMemberIds" TEXT NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "ClubTeamMember" ADD COLUMN "hidden" BOOLEAN NOT NULL DEFAULT false;
