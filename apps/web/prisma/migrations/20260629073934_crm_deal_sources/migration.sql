-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "sourceId" TEXT;

-- CreateIndex
CREATE INDEX "Deal_sourceId_idx" ON "Deal"("sourceId");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "LeadSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
