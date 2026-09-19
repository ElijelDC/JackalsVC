-- AlterTable
ALTER TABLE "Membership" ADD COLUMN "studentIdProofUrl" TEXT;
ALTER TABLE "Membership" ADD COLUMN "studentIdProofSubmittedAt" DATETIME;
ALTER TABLE "Membership" ADD COLUMN "studentIdReviewStatus" TEXT;
ALTER TABLE "Membership" ADD COLUMN "studentIdReviewedAt" DATETIME;
ALTER TABLE "Membership" ADD COLUMN "studentIdReviewedByUserId" TEXT;
ALTER TABLE "Membership" ADD COLUMN "studentIdReviewNote" TEXT;
