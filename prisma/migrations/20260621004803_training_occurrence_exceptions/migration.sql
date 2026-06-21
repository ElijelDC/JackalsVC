-- AlterTable
ALTER TABLE "Event" ADD COLUMN "trainingOccurrenceDate" DATETIME;

-- CreateTable
CREATE TABLE "TrainingOccurrenceException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingSessionId" TEXT NOT NULL,
    "occurrenceDate" DATETIME NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingOccurrenceException_trainingSessionId_fkey" FOREIGN KEY ("trainingSessionId") REFERENCES "TrainingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingOccurrenceException_trainingSessionId_occurrenceDate_key" ON "TrainingOccurrenceException"("trainingSessionId", "occurrenceDate");
