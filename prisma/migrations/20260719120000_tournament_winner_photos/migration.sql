-- CreateTable
CREATE TABLE "TournamentWinnerPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentSlug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OTHER',
    "imageUrl" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "TournamentWinnerPhoto_tournamentSlug_sortOrder_idx" ON "TournamentWinnerPhoto"("tournamentSlug", "sortOrder");
