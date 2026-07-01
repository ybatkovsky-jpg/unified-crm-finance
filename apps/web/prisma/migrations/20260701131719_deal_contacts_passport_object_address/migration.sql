-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "passportCode" TEXT,
ADD COLUMN     "passportIssuedAt" TIMESTAMP(3),
ADD COLUMN     "passportIssuedBy" TEXT,
ADD COLUMN     "passportNumber" TEXT,
ADD COLUMN     "passportSeries" TEXT,
ADD COLUMN     "registrationAddress" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "objectAddress" TEXT;

-- CreateTable
CREATE TABLE "DealContact" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealContact_dealId_idx" ON "DealContact"("dealId");

-- CreateIndex
CREATE INDEX "DealContact_contactId_idx" ON "DealContact"("contactId");

-- CreateIndex
CREATE UNIQUE INDEX "DealContact_dealId_contactId_role_key" ON "DealContact"("dealId", "contactId", "role");

-- AddForeignKey
ALTER TABLE "DealContact" ADD CONSTRAINT "DealContact_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealContact" ADD CONSTRAINT "DealContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
