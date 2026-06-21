-- CreateTable
CREATE TABLE "Production" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "plannedStartDate" DATETIME,
    "plannedEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "progress" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "attributes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Production_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "completedAt" DATETIME,
    "assigneeId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionStage_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Production_projectId_key" ON "Production"("projectId");

-- CreateIndex
CREATE INDEX "Production_status_idx" ON "Production"("status");

-- CreateIndex
CREATE INDEX "Production_deletedAt_idx" ON "Production"("deletedAt");

-- CreateIndex
CREATE INDEX "Production_projectId_idx" ON "Production"("projectId");

-- CreateIndex
CREATE INDEX "ProductionStage_productionId_order_idx" ON "ProductionStage"("productionId", "order");

-- CreateIndex
CREATE INDEX "ProductionStage_status_idx" ON "ProductionStage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionStage_productionId_code_key" ON "ProductionStage"("productionId", "code");
