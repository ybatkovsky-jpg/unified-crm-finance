# S05: Contract UI

**Goal:** UI для управления контрактами: список с фильтрами, детальная страница с версиями и подписантами
**Demo:** Страница /contracts со списком договоров, фильтрами. Детальная страница /contracts/[id] с версиями и подписантами.

## Must-Haves

- Страница /contracts с таблицей контрактов (столбцы: number, title, contact, amount, status, dates). Детальная /contracts/[id] с табами: Details (редактирование), Versions (история версий, добавить версию), Signers (список подписантов, добавить подписанта), Related (связанная сделка).

## Proof Level

- This slice proves: Can list contracts, view details with versions/signers tabs, add version/signer via modals, convert deal to contract

## Integration Closure

UI использует Contract API из S04, связывается с Deal API для автоподстановки при конвертации

## Verification

- Client-side errors трекаются, API calls логируются с таймингом, состояние контракта отображается явно

## Tasks

- [x] **T01: Contracts list page** `est:2h`
  Создать apps/web/src/app/contracts/page.tsx с таблицей контрактов. Использовать Table компонент, FilterBar для фильтров (status, contactId). Fetch через contractsApi.getContracts с query params.
  - Files: `apps/web/src/app/contracts/page.tsx`
  - Verify: Открыть /contracts, проверить таблицу, фильтры

- [ ] **T02: Contract detail page with tabs** `est:3h`
  Создать детальную страницу apps/web/src/app/contracts/[id]/page.tsx с табами. Tabs: Details (редактирование полей), Versions (список версий, кнопка добавить версию через модалку), Signers (список подписантов с датами подписания, кнопка добавить подписанта), Related (связанная сделка).
  - Files: `apps/web/src/app/contracts/[id]/page.tsx`, `apps/web/src/components/contracts/add-version-modal.tsx`, `apps/web/src/components/contracts/add-signer-modal.tsx`
  - Verify: Открыть /contracts/[id], проверить табы, модалки

## Files Likely Touched

- apps/web/src/app/contracts/page.tsx
- apps/web/src/app/contracts/[id]/page.tsx
- apps/web/src/components/contracts/add-version-modal.tsx
- apps/web/src/components/contracts/add-signer-modal.tsx
