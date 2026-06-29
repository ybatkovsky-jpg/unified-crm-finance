-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "warrantyEndDate" TIMESTAMP(3),
ADD COLUMN     "warrantyNotes" TEXT,
ADD COLUMN     "warrantyStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AcceptanceAct" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "signerType" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "signMethod" TEXT,
    "actFileId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceptanceAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignerBonus" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "designerId" TEXT,
    "percent" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignerBonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcceptanceAct_projectId_key" ON "AcceptanceAct"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "AcceptanceAct_actFileId_key" ON "AcceptanceAct"("actFileId");

-- CreateIndex
CREATE INDEX "AcceptanceAct_projectId_idx" ON "AcceptanceAct"("projectId");

-- CreateIndex
CREATE INDEX "AcceptanceAct_status_idx" ON "AcceptanceAct"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DesignerBonus_projectId_key" ON "DesignerBonus"("projectId");

-- CreateIndex
CREATE INDEX "DesignerBonus_projectId_idx" ON "DesignerBonus"("projectId");

-- CreateIndex
CREATE INDEX "DesignerBonus_status_idx" ON "DesignerBonus"("status");

-- CreateIndex
CREATE INDEX "DesignerBonus_designerId_idx" ON "DesignerBonus"("designerId");

-- AddForeignKey
ALTER TABLE "AcceptanceAct" ADD CONSTRAINT "AcceptanceAct_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceAct" ADD CONSTRAINT "AcceptanceAct_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceAct" ADD CONSTRAINT "AcceptanceAct_actFileId_fkey" FOREIGN KEY ("actFileId") REFERENCES "FileEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonus" ADD CONSTRAINT "DesignerBonus_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignerBonus" ADD CONSTRAINT "DesignerBonus_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
