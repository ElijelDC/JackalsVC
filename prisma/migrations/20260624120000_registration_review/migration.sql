-- AlterTable
ALTER TABLE "ClubMember" ADD COLUMN "registrationReviewStatus" TEXT;
ALTER TABLE "ClubMember" ADD COLUMN "registrationPhotoSubmittedAt" DATETIME;
ALTER TABLE "ClubMember" ADD COLUMN "registrationReviewedAt" DATETIME;
ALTER TABLE "ClubMember" ADD COLUMN "registrationReviewedByUserId" TEXT;
