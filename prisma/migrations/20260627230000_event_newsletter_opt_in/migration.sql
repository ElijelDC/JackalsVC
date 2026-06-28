-- CreateTable
CREATE TABLE "EventNewsletterSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventNewsletterSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EventNewsletterSubscription_email_key" ON "EventNewsletterSubscription"("email");
CREATE UNIQUE INDEX "EventNewsletterSubscription_userId_key" ON "EventNewsletterSubscription"("userId");
CREATE INDEX "EventNewsletterSubscription_active_idx" ON "EventNewsletterSubscription"("active");

-- DropColumn
PRAGMA foreign_keys=off;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "registrationCodeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_registrationCodeId_fkey" FOREIGN KEY ("registrationCodeId") REFERENCES "RegistrationCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("id", "name", "email", "passwordHash", "role", "registrationCodeId", "createdAt", "updatedAt")
SELECT "id", "name", "email", "passwordHash", "role", "registrationCodeId", "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=on;
