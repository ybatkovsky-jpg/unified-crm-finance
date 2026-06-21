---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T01: Prisma migrations for CRM models

Сгенерировать миграцию для CRM-моделей (Contact, LeadSource, Interaction, Lead) и применить её к dev-БД. Проверить что таблицы созданы через npx prisma studio или sqlite3.

## Inputs

- `apps/web/prisma/schema.prisma — CRM модели уже определены`

## Expected Output

- `apps/web/prisma/migrations/*/migration.sql — новая миграция`
- `apps/web/prisma/dev.db обновлён — таблицы Contact, LeadSource, Interaction, Lead созданы`

## Verification

npx prisma migrate status && npx prisma validate

## Observability Impact

npx prisma migrate покажет SQL. При ошибке — остановка с сообщением.
