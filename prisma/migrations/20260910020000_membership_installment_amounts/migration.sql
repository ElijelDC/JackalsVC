-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN "installment1Eur" REAL;
ALTER TABLE "MembershipPlan" ADD COLUMN "installment2Eur" REAL;
ALTER TABLE "MembershipPlan" ADD COLUMN "installment3Eur" REAL;

-- Backfill three instalments using the previous Oct/Jan/Mar weight split (3+2+2).
UPDATE "MembershipPlan"
SET
  "installment1Eur" = ROUND(price * 3.0 / 7.0, 2),
  "installment2Eur" = ROUND(price * 2.0 / 7.0, 2),
  "installment3Eur" = ROUND(price - ROUND(price * 3.0 / 7.0, 2) - ROUND(price * 2.0 / 7.0, 2), 2)
WHERE "installment1Eur" IS NULL;
