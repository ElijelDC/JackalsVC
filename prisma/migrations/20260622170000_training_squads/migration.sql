-- CreateTable
CREATE TABLE "TrainingSquad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainingSquad_key_key" ON "TrainingSquad"("key");

-- Seed default squads
INSERT INTO "TrainingSquad" ("id", "key", "name", "dayOfWeek", "sortOrder", "active", "createdAt", "updatedAt") VALUES
('squad_div2_mens', 'DIV2_MENS', 'Division 2 Mens', 4, 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('squad_div3_womens', 'DIV3_WOMENS', 'Division 3 Womens', 1, 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('squad_div4_mens', 'DIV4_MENS', 'Division 4 Mens', 3, 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
