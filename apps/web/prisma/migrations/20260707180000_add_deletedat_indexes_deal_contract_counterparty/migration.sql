-- Add deletedAt indexes for soft-delete performance on large tables
CREATE INDEX "Deal_deletedAt_idx" ON "Deal"("deletedAt");
CREATE INDEX "Contract_deletedAt_idx" ON "Contract"("deletedAt");
CREATE INDEX "Counterparty_deletedAt_idx" ON "Counterparty"("deletedAt");
