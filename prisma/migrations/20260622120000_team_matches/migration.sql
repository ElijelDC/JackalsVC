-- CreateTable
CREATE TABLE "TeamMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingTeamKey" TEXT NOT NULL,
    "opponentName" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "warmUpTime" DATETIME NOT NULL,
    "matchStart" DATETIME NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TeamMatch_trainingTeamKey_matchStart_idx" ON "TeamMatch"("trainingTeamKey", "matchStart");
