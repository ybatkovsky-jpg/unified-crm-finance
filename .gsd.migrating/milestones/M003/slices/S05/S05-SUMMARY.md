---
id: S05
parent: M009
milestone: M009
provides:
  - Contracts list UI with filters, contract detail page with tabs (Details/Versions/Signers/Related), ContractRepository, contractsApi client
requires:
  []
affects:
  - []
key_files:
  - apps/web/src/lib/db/contracts.ts, apps/web/src/lib/api/contracts.ts, apps/web/src/app/contracts/page.tsx, apps/web/src/app/contracts/[id]/page.tsx, apps/web/src/components/ui/tabs.tsx, apps/web/src/app/deals/[id]/page.tsx
key_decisions:
  - []
patterns_established:
  - []
observability_surfaces:
  - API timing logs via console.log, error logging with context labels
drill_down_paths:
  - []
duration: ""
verification_result: passed
completed_at: 2026-06-21T13:13:39.369Z
blocker_discovered: false
---

# S05: S05

**UI для управления контрактами: список с фильтрами, детальная страница с версиями и подписантами**

## What Happened

## Implementation Summary

Slice S05 delivered the contracts management UI with list and detail views.

### Tasks Completed

**T01** - ContractRepository и contractsApi клиент созданы; API endpoints готовы
- Создан ContractRepository (apps/web/src/lib/db/contracts.ts) с методами: findMany, findUnique, findByContact, findByDeal, create с автонумерацией Д-YYYY-NNNNN, update, softDelete, addVersion, addSigner, convertFromDeal
- Создан contractsApi клиент (apps/web/src/lib/api/contracts.ts) с методами для всех операций CRUD, включая convertDeal
- API endpoints готовы к использованию

**T01+** - Deal→Contract conversion UI trigger added (post-validation fix)
- Добавлена кнопка "В контракт" в deal detail page (apps/web/src/app/deals/[id]/page.tsx)
- Кнопка вызывает contractsApi.convertDeal и перенаправляет на созданный контракт
- Использует иконку FileText из lucide-react, состояние загрузки "Конвертация..."

**T02** - Contract detail page with tabs implemented
- Детальная страница apps/web/src/app/contracts/[id]/page.tsx с 4 табами
- Details tab: редактирование полей контракта с save/cancel
- Versions tab: таблица версий с модалкой для добавления новой версии
- Signers tab: таблица подписантов с модалкой для добавления
- Related tab: связанные сущности (контакт, сделка)
- Tabs компонент добавлен в apps/web/src/components/ui/tabs.tsx

**T03** - Contracts list page with table and filters
- Страница apps/web/src/app/contracts/page.tsx с таблицей контрактов
- Столбцы: Number, Title, Contact, Amount, Start Date, End Date, Status
- Фильтр по статусу (draft, active, expired, terminated, all)
- Фильтр по контакту с автоподстановкой имён/companies
- API timing логи для observability
- Error handling с retry кнопкой

### Deviations

T01 изначально планировал создать страницу /contracts, но вместо этого создал ContractRepository и contractsApi. Страница была создана в T03.

## Verification

## Verification Results

| Check | Result | Evidence |
|-------|--------|----------|
| ContractRepository exists | ✅ PASS | apps/web/src/lib/db/contracts.ts |
| contractsApi client exists | ✅ PASS | apps/web/src/lib/api/contracts.ts |
| Contracts list page exists | ✅ PASS | apps/web/src/app/contracts/page.tsx |
| Table with required columns | ✅ PASS | Number, Title, Contact, Amount, Dates, Status |
| Status filter implemented | ✅ PASS | Select component (draft/active/expired/terminated/all) |
| Contact filter implemented | ✅ PASS | Select populated from contactsApi |
| Contract detail page exists | ✅ PASS | apps/web/src/app/contracts/[id]/page.tsx |
| Details tab with edit mode | ✅ PASS | Form with save/cancel buttons |
| Versions tab with modal | ✅ PASS | Add version button + dialog |
| Signers tab with modal | ✅ PASS | Add signer button + dialog |
| Related tab | ✅ PASS | Contact and deal links |
| API timing logs | ✅ PASS | performance.now() calls |
| Error logging | ✅ PASS | console.error with context |
| Deal→Contract convert button | ✅ PASS | "В контракт" button in deal detail page (apps/web/src/app/deals/[id]/page.tsx) |

All Must-Have requirements verified.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

- []

## Requirements Invalidated or Re-scoped

None.

## Operational Readiness

None.

## Deviations

[]

## Known Limitations

[]

## Follow-ups

[]

## Files Created/Modified

None.
