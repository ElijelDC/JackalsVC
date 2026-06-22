-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "trainingTeamKey" TEXT;

-- AlterTable
ALTER TABLE "TrainingSession" ADD COLUMN "trainingTeamKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSession_trainingTeamKey_key" ON "TrainingSession"("trainingTeamKey");
