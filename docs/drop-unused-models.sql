-- ============================================================================
-- Unified CRM «ПРО Мебель» — удаление мёртвых моделей и колонки Role.permissions
-- ============================================================================
-- Назначение: привести БД в соответствие с schema.prisma после удаления
-- неиспользуемых моделей (календарь/события, Google-синк, лид, автоматизация,
-- классификация) и колонки Role.permissions (права — только в roles.ts).
--
-- ПРИМЕНЕНИЕ (один из вариантов):
--   A) Автоматически: `npx prisma migrate dev --name drop_unused_models`
--      (после правки schema.prisma; dev-сервер должен быть ОСТАНОВЛЕН — на Windows
--       запущенный node.exe держит query_engine и ломает prisma generate).
--   B) Вручную: применить этот файл через psql, затем `npx prisma generate`.
--      psql -h localhost -U postgres -d unified_crm -f docs/drop-unused-models.sql
--
-- ПЕРЕД ПРИМЕНЕНИЕМ: убедиться, что таблицы пусты/не нужны (см. audit_unified_crm.md §5).
-- Сделать резервную копию БД.
-- ============================================================================

-- 1. Снять связь Interaction → Event (мёртвый календарь)
ALTER TABLE "Interaction" DROP COLUMN IF EXISTS "eventId";

-- 2. Удалить таблицы мёртвых моделей (порядок учитывает внешние ключи)
DROP TABLE IF EXISTS "EventAttendee" CASCADE;
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "EventRecurrence" CASCADE;
DROP TABLE IF EXISTS "Lead" CASCADE;
DROP TABLE IF EXISTS "ClassificationRule" CASCADE;
DROP TABLE IF EXISTS "AutomationRule" CASCADE;
DROP TABLE IF EXISTS "PeriodClose" CASCADE;
DROP TABLE IF EXISTS "GoogleAccount" CASCADE;
DROP TABLE IF EXISTS "GoogleSyncLog" CASCADE;
DROP TABLE IF EXISTS "SyncLog" CASCADE;

-- 3. Единый источник прав по ролям — src/lib/auth/roles.ts
ALTER TABLE "Role" DROP COLUMN IF EXISTS "permissions";
