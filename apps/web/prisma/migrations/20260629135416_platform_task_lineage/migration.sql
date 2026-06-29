-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "failedReason" TEXT,
ADD COLUMN     "originalTaskId" TEXT,
ADD COLUMN     "parentTaskId" TEXT;

-- CreateIndex
CREATE INDEX "Task_type_idx" ON "Task"("type");

-- CreateIndex
CREATE INDEX "Task_originalTaskId_idx" ON "Task"("originalTaskId");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_originalTaskId_fkey" FOREIGN KEY ("originalTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
