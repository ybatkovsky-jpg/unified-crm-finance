-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "cost" DECIMAL(15,2),
ADD COLUMN     "deliveryType" TEXT DEFAULT 'supplier_to_production',
ADD COLUMN     "fromLocation" TEXT,
ADD COLUMN     "toLocation" TEXT;

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "materialMode" TEXT DEFAULT 'our_materials',
ADD COLUMN     "partnerId" TEXT;

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "plannedStartDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "advancePercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "advanceAmount" DECIMAL(15,2),
    "cost" DECIMAL(15,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstallationWorker" (
    "id" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "InstallationWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contractId" TEXT,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installation_projectId_number_idx" ON "Installation"("projectId", "number");

-- CreateIndex
CREATE INDEX "Installation_status_idx" ON "Installation"("status");

-- CreateIndex
CREATE INDEX "InstallationWorker_installationId_idx" ON "InstallationWorker"("installationId");

-- CreateIndex
CREATE INDEX "InstallationWorker_userId_idx" ON "InstallationWorker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstallationWorker_installationId_userId_key" ON "InstallationWorker"("installationId", "userId");

-- CreateIndex
CREATE INDEX "ChangeOrder_projectId_number_idx" ON "ChangeOrder"("projectId", "number");

-- CreateIndex
CREATE INDEX "ChangeOrder_status_idx" ON "ChangeOrder"("status");

-- AddForeignKey
ALTER TABLE "Production" ADD CONSTRAINT "Production_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Counterparty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationWorker" ADD CONSTRAINT "InstallationWorker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstallationWorker" ADD CONSTRAINT "InstallationWorker_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChangeOrder" ADD CONSTRAINT "ChangeOrder_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
