---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Contracts list page

Создать apps/web/src/app/contracts/page.tsx с таблицей контрактов. Использовать Table компонент, FilterBar для фильтров (status, contactId). Fetch через contractsApi.getContracts с query params.

## Inputs

- `apps/web/src/app/crm/contacts/page.tsx`

## Expected Output

- `Страница /contracts с таблицей`
- `Столбцы: number, title, contact, amount, status, startDate, endDate`
- `Фильтры: status, contactId`
- `Click на строку → detail page`

## Verification

Открыть /contracts, проверить таблицу, фильтры
