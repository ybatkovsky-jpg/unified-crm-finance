# Phase 4: CRM (ядро) — Verification

**Date:** 2026-06-29
**Status:** ✅ PASSED

## Verified Requirements

| REQ | Description | Verified | Evidence |
|-----|-------------|----------|----------|
| CRM-01 | 10 источников лида (канонический список ТЗ) | ✅ | seed.ts создаёт 10 активных + 4 deprecated; `GET /api/lead-sources` возвращает 10; UI Select в create-deal-modal; badge на detalях; `source=2ГИС` в API |
| CRM-03 | Дни до конца проекта на карточке | ✅ | GET /api/deals включает Project {id, endDate, externalNumber}; deal-card показывает deadline проекта (приоритет над expectedCloseDate) |
| CRM-06 | Отказ с обязательной причиной | ✅ | `moveStage` требует `lossReason` при `isLostStage`; без причины → 400 «lossReason is required»; невалидный код → 400 «Invalid loss reason»; с валидной → 200, `lossReason=too_expensive`, `closedAt` проставлен |
| CRM-07 | Единая нумерация ПМ{год}-NNNN + автосоздание проекта/договора | ✅ | `POST /api/deals/[id]/convert-to-project` создаёт проект+договор с одинаковым номером `ПМ2026-0001`; `sequence.ts` считает последовательно; `projects.ts` использует общий генератор |

## Smoke Test Results

```
✅ Login admin@local/admin123 → 200 + JWT cookie
✅ GET /api/lead-sources → 10 active sources (2gis, website, internet, instagram, vk, telegram_group, office, referral, old_base, designer)
✅ POST /api/deals + sourceId → 201, source linked
✅ GET /api/deals/[id] → source populated
✅ POST /api/deals/[id]/move → lost WITHOUT lossReason → 400 «lossReason is required»
✅ POST /api/deals/[id]/move → lost WITH invalid lossReason → 400 «Invalid loss reason»
✅ POST /api/deals/[id]/move → lost WITH valid lossReason → 200, closedAt + actualCloseDate set
✅ POST /api/deals/[id]/convert-to-project → 201, project+contract both ПМ2026-0001, deal moved to «contract» stage
✅ GET /api/deals → source=2ГИС, project=ПМ2026-0001
✅ tsc --noEmit → 0 app errors (only .next/dev/types/validator.ts pre-existing)
```

## Generated Files
- Migration: `20260629073934_crm_deal_sources` — Deal.sourceId + FK
- Migration: `20260629075519_crm_deal_project_relation` — Deal↔Project relation
