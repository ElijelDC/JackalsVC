-- CreateTable
CREATE TABLE "TournamentCover" (
    "tournamentSlug" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
