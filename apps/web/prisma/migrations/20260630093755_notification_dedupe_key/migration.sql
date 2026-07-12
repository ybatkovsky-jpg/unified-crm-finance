-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupeKey" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_dedupeKey_isRead_idx" ON "Notification"("userId", "dedupeKey", "isRead");
