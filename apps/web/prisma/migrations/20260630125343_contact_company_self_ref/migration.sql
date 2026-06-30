-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "companyId" TEXT;

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Task_dealId_idx" ON "Task"("dealId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
