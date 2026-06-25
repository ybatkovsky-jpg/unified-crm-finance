---
id: M004
title: "Проекты"
status: complete
completed_at: 2026-06-23T08:25:25.297Z
key_decisions:
  - Project.id и Production.id генерируются через randomUUID() вручную — без @default в schema
  - Project.updatedAt устанавливается вручную на update — без @updatedAt
  - ProjectStage pipeline: 8 стандартных этапов от подписания контракта до гарантийного обслуживания
  - Production имеет 1:N связь с ProductionStage, автосоздание 8 этапов при создании production
  - vis-timeline@8.5.1 для Gantt с импортом DataSet из vis-data/peer
  - Cascade close через Prisma transaction: атомарное обновление Project.status + Deal.stageId/closedAt
  - File upload через @aws-sdk/client-s3 с MinIO (S3-compatible), FileEntity модель для метаданных
key_files:
  - apps/web/prisma/schema.prisma
  - apps/web/src/repositories/productionRepository.ts
  - apps/web/src/repositories/projectRepository.ts
  - apps/web/src/lib/api/projects.ts
  - apps/web/src/app/api/projects/route.ts
  - apps/web/src/app/projects/page.tsx
  - apps/web/src/app/projects/[id]/page.tsx
  - apps/web/src/components/projects/project-gantt.tsx
  - apps/web/src/components/projects/production-detail-card.tsx
  - apps/web/src/components/ui/file-upload.tsx
  - apps/web/src/lib/s3.ts
lessons_learned:
  - Prisma 6.x vs 7.x: datasource url в schema.prisma vs prisma.config.ts — залочились на 6.6.0
  - SQLite для dev вместо PostgreSQL из-за недоступности Docker Desktop
  - SQLite не поддерживает String[] — использовать Json с @default("[]")
  - Все модели требуют ручной UUID генерации и ручного updatedAt
  - vis-timeline: DataSet импортируется из vis-data/peer, не из vis-timeline/standalone
  - ProductionApiClient следует тому же паттерну (singleton export), что и ProjectApiClient
---

# M004: Проекты

**Модуль управления проектами: Project CRUD, Gantt timeline с drag-drop, Production tracking, File upload с cascading preview, Cascade close сделка↔проект. 7 slices, 36 tasks, все success criteria выпол**

## What Happened

Milestone M004 реализовал полный модуль управления проектами для unified-crm-finance. 

S01 заложил фундамент — Production/ProductionStage модели в Prisma schema и ProductionRepository с 45 unit тестами (CRUD, soft-delete, status workflows).

S02 создал ProjectRepository, ProjectStage pipeline (8 стандартных этапов), ProjectMember management, ProjectApiClient с 44 тестами, и полный REST API: GET/POST /api/projects, GET/PATCH/DELETE /api/projects/[id], GET/POST /api/projects/[id]/stages, GET/POST /api/projects/[id]/members, GET /api/projects/[id]/related-deals.

S03 построил UI: /projects со списком проектов (фильтрация по статусу/менеджеру, search), CreateProjectModal с поисковыми dropdown'ами для контактов/сделок/контрактов.

S04 создал страницу деталей проекта /projects/[id] с вкладками (Overview/Stages/Team/Files), редактированием полей, списком этапов с цветовой кодировкой.

S05 реализовал Gantt timeline на vis-timeline с drag-drop редактированием дат, цветовой кодировкой по статусу (green/blue/gray/red) и day-level zoom.

S06 добавил Production management: CreateProductionModal с автосозданием 8 этапов, ProductionDetailCard с действиями Start/Complete/Status Change, интеграцию на страницу проекта.

S07 завершил интеграцию: FileUpload компонент с drag-drop/прогрессом/preview/удалением, интеграция в Deal detail (чертежи/акты) и Project detail (спецификации), cascade close (акт → проект → сделка) через Prisma transaction.

Обнаружена и исправлена одна документационная неточность: S05 в метаданных ошибочно ссылался на S03 вместо S04.

## Success Criteria Results

| Criterion | Status |
|-----------|--------|
| 1. Создание проекта из сделки и просмотр в списке | PASS |
| 2. Gantt timeline с датами и цветовой кодировкой | PASS |
| 3. Production сущность с этапами и tracking | PASS |
| 4. File upload с drag & drop, preview, удаление | PASS |
| 5. Cascade close: акт → проект → сделка | PASS |

## Definition of Done Results

Все 7 slices завершены (36/36 tasks). Все 4 verification classes (Contract, Integration, Operational, UAT) — PASS. TypeScript компиляция чистая. Все unit тесты проходят.

## Requirement Outcomes

| Requirement | Outcome |
|-------------|---------|
| R013 — Модуль проекты | COVERED — полная реализация |
| R001 — Production модели | COVERED — в S01 |
| R002 — Stage pipeline | COVERED — в S04 |
| R003 — Project CRUD UI | COVERED — в S03/S04 |
| R020 — Задачи | PARTIAL — primary owner M001 |

## Deviations

S05: добавлен externalNumber в ProjectUpdateInput (отсутствовал, но использовался). Иконка Stages заменена на Layers (отсутствует в lucide-react). S07: MinIO client настроен на localhost:9000 (dev), продакшн потребует переконфигурации.

## Follow-ups

None.
