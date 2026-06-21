---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T02: Filters и Create Deal Modal

Создать компоненты для фильтрации и quick actions. FilterBar с dropdowns для pipeline, manager, status. CreateDealButton с модальным диалогом для создания сделки. RefreshButton для reload данных.

## Inputs

- `apps/web/src/app/api/deals/route.ts`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/select.tsx`

## Expected Output

- `FilterBar компонент с select dropdowns`
- `CreateDealModal с формой (title, contactId, amount, expectedCloseDate)`
- `Кнопка 'Создать сделку' вызывает POST /api/deals`
- `После создания обновляется список`

## Verification

Открыть /deals, проверить фильтры, создать сделку через модалку
