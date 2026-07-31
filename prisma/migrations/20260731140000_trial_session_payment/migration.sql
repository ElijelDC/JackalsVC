-- AlterTable
ALTER TABLE "TrialSession" ADD COLUMN "paymentUrl" TEXT;
ALTER TABLE "TrialSession" ADD COLUMN "reclubUsername" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrialSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "location" TEXT,
    "paymentUrl" TEXT,
    "reclubUsername" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TrialSession" ("id", "slug", "title", "description", "startDate", "endDate", "location", "paymentUrl", "reclubUsername", "active", "createdAt", "updatedAt")
SELECT "id", "slug", "title", "description", "startDate", "endDate", "location", NULL, NULL, "active", "createdAt", "updatedAt" FROM "TrialSession";
DROP TABLE "TrialSession";
ALTER TABLE "new_TrialSession" RENAME TO "TrialSession";
CREATE UNIQUE INDEX "TrialSession_slug_key" ON "TrialSession"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
