ALTER TABLE "Membership" ADD COLUMN "paymentOverdueOverrideUntil" DATETIME;
ALTER TABLE "Membership" ADD COLUMN "paymentDeferralExcuse" TEXT;
ALTER TABLE "Membership" ADD COLUMN "paymentDeferralDueDate" DATETIME;
ALTER TABLE "Membership" ADD COLUMN "paymentDeferralRequestedAt" DATETIME;
