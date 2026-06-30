-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "orgFunctionId" TEXT,
ADD COLUMN     "plannedDate" TIMESTAMP(3),
ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgFunction" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OrgFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionAssignment" (
    "id" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'responsible',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTemplate" (
    "id" TEXT NOT NULL,
    "functionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "rrule" TEXT,
    "dtStart" TIMESTAMP(3) NOT NULL,
    "dtEnd" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assigneeStrategy" TEXT NOT NULL DEFAULT 'function_responsible',
    "fixedAssigneeId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TaskTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_deletedAt_idx" ON "Department"("deletedAt");

-- CreateIndex
CREATE INDEX "OrgFunction_departmentId_deletedAt_idx" ON "OrgFunction"("departmentId", "deletedAt");

-- CreateIndex
CREATE INDEX "OrgFunction_deletedAt_idx" ON "OrgFunction"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrgFunction_departmentId_name_key" ON "OrgFunction"("departmentId", "name");

-- CreateIndex
CREATE INDEX "FunctionAssignment_functionId_idx" ON "FunctionAssignment"("functionId");

-- CreateIndex
CREATE INDEX "FunctionAssignment_userId_idx" ON "FunctionAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionAssignment_functionId_userId_role_key" ON "FunctionAssignment"("functionId", "userId", "role");

-- CreateIndex
CREATE INDEX "TaskTemplate_functionId_idx" ON "TaskTemplate"("functionId");

-- CreateIndex
CREATE INDEX "TaskTemplate_isActive_idx" ON "TaskTemplate"("isActive");

-- CreateIndex
CREATE INDEX "TaskTemplate_deletedAt_idx" ON "TaskTemplate"("deletedAt");

-- CreateIndex
CREATE INDEX "Task_templateId_plannedDate_idx" ON "Task"("templateId", "plannedDate");

-- CreateIndex
CREATE INDEX "Task_orgFunctionId_idx" ON "Task"("orgFunctionId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "TaskTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_orgFunctionId_fkey" FOREIGN KEY ("orgFunctionId") REFERENCES "OrgFunction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgFunction" ADD CONSTRAINT "OrgFunction_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionAssignment" ADD CONSTRAINT "FunctionAssignment_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "OrgFunction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionAssignment" ADD CONSTRAINT "FunctionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "OrgFunction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTemplate" ADD CONSTRAINT "TaskTemplate_fixedAssigneeId_fkey" FOREIGN KEY ("fixedAssigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
