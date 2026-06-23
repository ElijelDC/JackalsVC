-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "coachPaymentType" TEXT;

-- Existing coaches default to paid salary
UPDATE "ClubMember"
SET "coachPaymentType" = 'PAID'
WHERE "rosterRole" = 'COACH';
