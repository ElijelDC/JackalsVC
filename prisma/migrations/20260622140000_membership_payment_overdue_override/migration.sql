ALTER TABLE "Membership" ADD COLUMN "paymentOverdueOverride" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Membership" ADD COLUMN "paymentOverdueOverrideNote" TEXT;
