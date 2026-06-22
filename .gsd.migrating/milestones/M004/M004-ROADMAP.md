# M004: Проекты

**Vision:** Модуль управления проектами — параллельная lifetime со сделкой система для tracking исполнения контрактов. Проект создаётся на этапе "Подписан контракт" в сделке и существует независимо от коммерческого pipeline сделки.

## Success Criteria

- Пользователь может создать проект из сделки (на этапе контракта) и увидеть его в списке проектов
- Gantt timeline показывает этапы проекта с корректными датами и цветовой кодировкой по статусу
- Пользователь может создать Production сущность, добавить этапы производства, и tracking процесс до поставки на объект
- File upload работает: drag & drop, preview, удаление. Чертежи прикрепляются к сделке, спецификации к проекту
- Cascade close: акт закрывает проект → сделка закрывается автоматически (или наоборот)

## Slices

- [x] **S01: S01** `risk:high` `depends:[]`
  > After this: ProductionRepository passes all unit tests (CRUD + softDelete), Prisma migration applies successfully

- [x] **S02: S02** `risk:high` `depends:[]`
  > After this: ProjectRepository passes unit tests (CRUD, softDelete, count), ProjectApiClient can create/read/update/delete via curl

- [x] **S03: S03** `risk:medium` `depends:[]`
  > After this: User can browse /dashboard/projects, filter by status/manager, create project via modal, see project cards in table

- [x] **S04: S04** `risk:medium` `depends:[]`
  > After this: User can view /dashboard/projects/[id], see project info, stages list, team members with roles, related deal/contract

- [x] **S05: S05** `risk:high` `depends:[]`
  > After this: User can see Gantt chart on project detail, drag dates to update, color coding by status, day-level zoom

- [x] **S06: S06** `risk:medium` `depends:[]`
  > After this: User can create Production records (PLATE/COUNTERTOP), manage production stages, see status in project detail

- [ ] **S07: File Upload + Cascade Close** `risk:medium` `depends:[S04,S06]`
  > After this: User can drag-drop files to attach (drawings to deals, specs to projects), preview works, delete works; closing project with act cascades to deal

## Boundary Map

## Scope Boundaries\n\n### In Scope\n- Project CRUD (создание из сделки + отдельно)\n- ProjectStage pipeline (8 стандартных этапов)\n- ProjectMember management (множественные роли)\n- Gantt timeline (vis-timeline, drag-drop, цвет по статусу)\n- Production entity + ProductionStage (PLATE, COUNTERTOP)\n- File upload UI (drag-drop, preview, delete)\n- File attachments: чертежи к сделкам, акты к сделкам, спецификации к проектам\n- Cascade close: акт ↔ проект ↔ сделка\n\n### Out of Scope\n- Task Manager (организационные задачи) — отдельная сущность\n- Gantt advanced features (critical path, resource leveling, export PDF) — M007\n- Production planning (BOM optimization) — M005\n- Финансовая отчетность по проектам — M006\n\n### Integration Points\n- Deal: создание проекта на этапе контракта, cascade close\n- Contract: привязка проекта к контракту\n- Contact: клиент проекта\n- FileEntity: storage для чертежей, актов, спецификаций\n- User/Role: команда проекта, RBAC\n- BOM/BOMItem: спецификации проекта (уже существуют)
