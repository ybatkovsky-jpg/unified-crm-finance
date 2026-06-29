-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "projectId" DROP NOT NULL;

-- ACCT-01/03: уникальность организационного бюджета (постоянные расходы) по статье+периоду.
-- Обычный unique-constraint (projectId, categoryId, period) не ловит NULL-строки
-- (NULL != NULL в SQL), поэтому отдельный partial index для орг-бюджетов.
CREATE UNIQUE INDEX "budget_org_category_period_unique"
  ON "Budget" ("categoryId", "period")
  WHERE "projectId" IS NULL;
