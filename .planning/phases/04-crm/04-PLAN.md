# Phase 4 (ядро): CRM — жизненный цикл сделки - Plan

**Status:** Approved
**Requirements:** CRM-01, CRM-03, CRM-06, CRM-07 (ядро фазы 4).

## Задачи

### Шаг 1 — CRM-01: Источники лида
- [ ] Миграция: `Deal.sourceId String?` + relation `Deal → LeadSource` (`LeadSource` получает back-relation `Deal[]`).
- [ ] `prisma migrate dev --name crm_deal_sources`.
- [ ] seed.ts: 10 канонических источников; старые коды → `isActive:false`.
- [ ] `GET /api/lead-sources` (route.ts) — активные источники.
- [ ] `lib/api/lead-source.ts` — клиент + тип `LeadSourceData`.
- [ ] types.ts: `sourceId?` в DealData/DealCreateInput/DealUpdateInput.
- [ ] API `/api/deals` POST + `[id]` PATCH: приём/сохранение sourceId.
- [ ] UI: Select источника в `create-deal-modal.tsx`; badge на `deals/[id]/page.tsx`.

### Шаг 2 — CRM-06: Отказ с причиной
- [ ] `lib/loss-reasons.ts`: `LOSS_REASONS` константы + `isValidLossReason(code)`.
- [ ] `deals.moveStage`: параметр `lossReason?`; обязательность при `isLostStage`.
- [ ] роут `/move`: приём lossReason; мапить ошибку обязательности в 400.
- [ ] UI: `loss-deal-dialog.tsx` (причина + опц. комментарий); вызов при выборе lost-стадии в inline-selector страницы сделки.

### Шаг 3 — CRM-07: Единая нумерация + автосоздание
- [ ] `lib/db/sequence.ts`: `nextProjectNumber(tx, year)` → `ПМ{год}-{0001}`.
- [ ] `projects.ts`: убрать `generateExternalNumber()` (PRJ-random), использовать общий генератор.
- [ ] `contracts.ts`: `convertFromDeal` принимает опц. общий `number`; для пути deal→contract использовать общий номер.
- [ ] Новый роут `POST /api/deals/[id]/convert-to-project`: одна транзакция (проект + договор с общим номером + линковка + смена стадии на contract).
- [ ] `deals.moveStage`: при `stage.code==='contract'` + пустой projectId + есть contactId → автосоздание.
- [ ] UI: одна кнопка «Создать проект и договор» вместо раздельных; показать ПМ-номер.

### Шаг 4 — CRM-03: Дни до конца проекта
- [ ] API `/api/deals` GET: include `Project { id, endDate, externalNumber }`; маппер → `project`.
- [ ] types.ts: `ProjectLiteData`, поле в DealData.
- [ ] `deal-card.tsx`: «N дн. до конца проекта» при `deal.project?.endDate`.

### Шаг 5 — Верификация
- [ ] `tsc --noEmit` — 0 новых ошибок прод-кода.
- [ ] smoke: создать сделку с источником → move на contract → автосоздание `ПМ{год}-0001` (проект+договор, общий номер) → move на lost без причины (400) / с причиной (ок) → карточка показывает дни.
- [ ] 04-VERIFICATION.md, 04-SUMMARY.md.
- [ ] коммит `feat(crm): phase 4 — lead sources, loss reasons, unified numbering`.

## Verification Criteria (соответствие Success Criteria ROADMAP)
1. При создании сделки выбирается источник из полного списка (10 канонических) — CRM-01.
2. Карточка показывает дни до конца проекта — CRM-03.
3. Сделку можно закрыть отказом только с причиной из справочника — CRM-06.
4. Перевод в «договор заключён» создаёт проект+договор с общим номером `ПМ{год}-0001` — CRM-07.
