-- AlterTable
ALTER TABLE "ClubMemberCoachSquad" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 100;

-- Backfill: coaches whose primary ClubMember.trainingTeamKey matches this squad row
-- are treated as head coach (priority 0) for that squad.
UPDATE "ClubMemberCoachSquad"
SET "priority" = 0
WHERE EXISTS (
  SELECT 1
  FROM "ClubMember"
  WHERE "ClubMember"."id" = "ClubMemberCoachSquad"."clubMemberId"
    AND "ClubMember"."rosterRole" = 'COACH'
    AND "ClubMember"."trainingTeamKey" = "ClubMemberCoachSquad"."trainingTeamKey"
);

-- If multiple heads were set for one squad, keep the earliest join row as head.
UPDATE "ClubMemberCoachSquad"
SET "priority" = 100
WHERE "priority" = 0
  AND "id" NOT IN (
    SELECT "id" FROM (
      SELECT MIN("id") AS "id"
      FROM "ClubMemberCoachSquad"
      WHERE "priority" = 0
      GROUP BY "trainingTeamKey"
    )
  );

-- CreateIndex
CREATE INDEX "ClubMemberCoachSquad_trainingTeamKey_priority_idx" ON "ClubMemberCoachSquad"("trainingTeamKey", "priority");
