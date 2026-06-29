# Phase 5b: Проект — спецификация и закупки — CONTEXT

**Date:** 2026-06-29
**Status:** Complete
**Scope:** PROJ-01..07

## Что сделано

### PROJ-01: Воронка проекта (Stage Management)
- Создан компонент `StageManager` для управления стадиями проекта
- Кнопки «Начать»/«Завершить» с соблюдением порядка стадий
- Расширен PATCH `/api/projects/[id]/stages/[stageId]` для обновления статуса стадии
- Добавлен метод `updateProjectStage` в API-клиент

### PROJ-02: Замер #2
- Создан API `/api/tasks` для создания задач
- Компонент `CreateMeasurementTask` с диалогом
- Кнопка «Замер #2» на странице проекта
- Тип задачи `measurement_2`, назначается на технолога/монтажника

### PROJ-03: Спецификация (BOM)
- Добавлено поле `material` в BOMItem (schema + API + UI)
- Колонка «Материал» в BOMSection
- Поддержка material в Excel-импорте
- Запрет удаления BOMItem при locked BOM (аналог PATCH-проверки)

### PROJ-04: Закупки + склад
- PurchaseRequestCreateDialog показывает доступность на складе
- Поиск складских позиций по артикулу/наименованию
- Авто-резервирование склада при создании PR
- Поле `availableQty` в PR-позициях

### PROJ-05: Сверка ответов поставщика
- Секция «Сверка ответа» на странице PR
- Поля: подтверждённое количество, срок поставки
- Подсветка расхождений (запрошено vs получено)
- PATCH `/api/purchase-requests/items/[id]` для обновления полей сверки

### PROJ-06: Воронка закупки
- Поле `itemStatus` на PurchaseRequestItem (ordered/received)
- Кнопка «Получить товар» на странице PR
- Авто-создание складской транзакции (in) при получении
- Прогресс-бар получения позиций
- Связанные счета отображаются на странице PR
- Фильтр `purchaseRequestId` в invoices API

### PROJ-07: Покрытие
- Бейдж покрытия в списке проектов (Нет спецификации / Черновик / Заблокирована)
- Бейдж «X/Y заказано» в BOMSection (существовал ранее)

## Изменения в схеме
- `BOMItem.material` (String?, новый столбец)
- `PurchaseRequestItem.itemStatus` (String, default "ordered")

## Новые файлы
- `apps/web/src/app/api/tasks/route.ts`
- `apps/web/src/lib/api/tasks.ts`
- `apps/web/src/components/projects/create-measurement-task.tsx`
- `apps/web/src/components/projects/stage-manager.tsx`
- `apps/web/src/app/api/purchase-requests/items/[id]/receive/route.ts`

## Изменённые файлы
- `apps/web/prisma/schema.prisma` — поля material, itemStatus
- `apps/web/src/app/api/bom/items/[id]/route.ts` — lock check на DELETE, material в PATCH
- `apps/web/src/components/procurement/bom-section.tsx` — колонка material
- `apps/web/src/components/procurement/purchase-request-create-dialog.tsx` — интеграция склада
- `apps/web/src/lib/api/types.ts` — BOMItemCreateInput/UpdateInput + material, InvoiceListParams + purchaseRequestId
- `apps/web/src/lib/api/purchase-requests.ts` — receiveItem метод
- `apps/web/src/lib/api/invoices.ts` — purchaseRequestId фильтр
- `apps/web/src/lib/db/invoices.ts` — purchaseRequestId в findMany
- `apps/web/src/app/api/invoices/route.ts` — purchaseRequestId параметр
- `apps/web/src/app/api/projects/[id]/stages/[stageId]/route.ts` — поддержка status
- `apps/web/src/lib/api/projects.ts` — updateProjectStage метод
- `apps/web/src/app/(app)/projects/[id]/page.tsx` — StageManager, кнопка Замер #2
- `apps/web/src/app/(app)/projects/page.tsx` — бейдж покрытия
- `apps/web/src/app/(app)/procurement/purchase-requests/[id]/page.tsx` — получение товара, сверка, связанные счета
- `apps/web/src/app/api/purchase-requests/items/[id]/route.ts` — PATCH для сверки
- `.planning/STATE.md` — прогресс 70%, Phase 5b ✅
- `.planning/REQUIREMENTS.md` — PROJ-01..07 ✅ Validated
