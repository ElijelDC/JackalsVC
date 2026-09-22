-- One special order per member / email.
-- Keep the earliest row when duplicate emails already exist locally.

DELETE FROM "SpecialOrder"
WHERE "id" NOT IN (
  SELECT "id" FROM (
    SELECT MIN("id") AS "id"
    FROM "SpecialOrder"
    GROUP BY lower("email")
  )
);

-- AlterTable
ALTER TABLE "SpecialOrder" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SpecialOrder_userId_key" ON "SpecialOrder"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialOrder_email_key" ON "SpecialOrder"("email");
