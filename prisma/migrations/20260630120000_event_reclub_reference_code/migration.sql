-- AlterTable
ALTER TABLE "Event" ADD COLUMN "reclubReferenceCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_reclubReferenceCode_key" ON "Event"("reclubReferenceCode");
