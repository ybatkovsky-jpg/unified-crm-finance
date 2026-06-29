-- AddForeignKey
ALTER TABLE "DealHistory" ADD CONSTRAINT "DealHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "DealStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealHistory" ADD CONSTRAINT "DealHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "DealStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealHistory" ADD CONSTRAINT "DealHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
