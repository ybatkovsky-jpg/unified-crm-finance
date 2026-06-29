-- AlterTable
ALTER TABLE "BOMItem" ADD COLUMN     "material" TEXT;

-- AlterTable
ALTER TABLE "PurchaseRequestItem" ADD COLUMN     "itemStatus" TEXT NOT NULL DEFAULT 'ordered';

-- CreateIndex
CREATE INDEX "PurchaseRequestItem_itemStatus_idx" ON "PurchaseRequestItem"("itemStatus");
