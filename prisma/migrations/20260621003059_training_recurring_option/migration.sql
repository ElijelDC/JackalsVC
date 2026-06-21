-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TrainingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT,
    "coach" TEXT,
    "attendanceUrl" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT true,
    "recurrenceWeeks" INTEGER NOT NULL DEFAULT 1,
    "sessionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_TrainingSession" ("attendanceUrl", "coach", "createdAt", "dayOfWeek", "description", "endTime", "id", "level", "location", "startTime", "title") SELECT "attendanceUrl", "coach", "createdAt", "dayOfWeek", "description", "endTime", "id", "level", "location", "startTime", "title" FROM "TrainingSession";
DROP TABLE "TrainingSession";
ALTER TABLE "new_TrainingSession" RENAME TO "TrainingSession";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
