-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Deal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT,
    "amount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "expectedCloseDate" DATETIME,
    "actualCloseDate" DATETIME,
    "managerId" TEXT,
    "description" TEXT,
    "lossReason" TEXT,
    "attributes" JSONB,
    "contractId" TEXT,
    "projectId" TEXT,
    "drawingFileId" TEXT,
    "actFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    "deletedAt" DATETIME,
    CONSTRAINT "Deal_actFileId_fkey" FOREIGN KEY ("actFileId") REFERENCES "FileEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "DealStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_drawingFileId_fkey" FOREIGN KEY ("drawingFileId") REFERENCES "FileEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deal_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Deal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Deal" ("actualCloseDate", "amount", "attributes", "closedAt", "contactId", "contractId", "createdAt", "currency", "deletedAt", "description", "expectedCloseDate", "id", "lossReason", "managerId", "number", "pipelineId", "projectId", "stageId", "title", "updatedAt") SELECT "actualCloseDate", "amount", "attributes", "closedAt", "contactId", "contractId", "createdAt", "currency", "deletedAt", "description", "expectedCloseDate", "id", "lossReason", "managerId", "number", "pipelineId", "projectId", "stageId", "title", "updatedAt" FROM "Deal";
DROP TABLE "Deal";
ALTER TABLE "new_Deal" RENAME TO "Deal";
CREATE UNIQUE INDEX "Deal_number_key" ON "Deal"("number");
CREATE UNIQUE INDEX "Deal_contractId_key" ON "Deal"("contractId");
CREATE UNIQUE INDEX "Deal_projectId_key" ON "Deal"("projectId");
CREATE INDEX "Deal_projectId_idx" ON "Deal"("projectId");
CREATE INDEX "Deal_contractId_idx" ON "Deal"("contractId");
CREATE INDEX "Deal_expectedCloseDate_idx" ON "Deal"("expectedCloseDate");
CREATE INDEX "Deal_managerId_idx" ON "Deal"("managerId");
CREATE INDEX "Deal_stageId_idx" ON "Deal"("stageId");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "externalNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dealId" TEXT,
    "contractId" TEXT,
    "contactId" TEXT,
    "specFileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'lead',
    "contractAmount" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "completedAt" DATETIME,
    "marginTarget" REAL NOT NULL DEFAULT 0.25,
    "qualityRating" TEXT,
    "deadlineStatus" TEXT NOT NULL DEFAULT 'on_track',
    "managerId" TEXT,
    "attributes" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Project_specFileId_fkey" FOREIGN KEY ("specFileId") REFERENCES "FileEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("attributes", "completedAt", "contactId", "contractAmount", "contractId", "createdAt", "currency", "deadlineStatus", "dealId", "deletedAt", "description", "endDate", "externalNumber", "id", "managerId", "marginTarget", "name", "qualityRating", "startDate", "status", "updatedAt") SELECT "attributes", "completedAt", "contactId", "contractAmount", "contractId", "createdAt", "currency", "deadlineStatus", "dealId", "deletedAt", "description", "endDate", "externalNumber", "id", "managerId", "marginTarget", "name", "qualityRating", "startDate", "status", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_externalNumber_key" ON "Project"("externalNumber");
CREATE UNIQUE INDEX "Project_dealId_key" ON "Project"("dealId");
CREATE UNIQUE INDEX "Project_contractId_key" ON "Project"("contractId");
CREATE INDEX "Project_contractId_idx" ON "Project"("contractId");
CREATE INDEX "Project_dealId_idx" ON "Project"("dealId");
CREATE INDEX "Project_managerId_idx" ON "Project"("managerId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
