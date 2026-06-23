-- CreateTable
CREATE TABLE "CoachSalaryPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clubMemberId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "ratePerSession" REAL NOT NULL DEFAULT 25,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "invoiceScreenshotUrl" TEXT,
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoachSalaryPayment_clubMemberId_fkey" FOREIGN KEY ("clubMemberId") REFERENCES "ClubMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachSalaryPayment_clubMemberId_year_month_key" ON "CoachSalaryPayment"("clubMemberId", "year", "month");

-- CreateIndex
CREATE INDEX "CoachSalaryPayment_year_month_idx" ON "CoachSalaryPayment"("year", "month");
