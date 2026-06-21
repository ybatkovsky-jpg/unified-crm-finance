---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T02: Contract detail page with tabs already implemented: Details, Versions, Signers, Related

Создать детальную страницу apps/web/src/app/contracts/[id]/page.tsx с табами. Tabs: Details (редактирование полей), Versions (список версий, кнопка добавить версию через модалку), Signers (список подписантов с датами подписания, кнопка добавить подписанта), Related (связанная сделка).

## Inputs

- `apps/web/src/app/deals/[id]/page.tsx`

## Expected Output

- `Страница /contracts/[id] с layout`
- `Таб 1: Details с edit mode`
- `Таб 2: Versions с списком и AddVersionModal`
- `Таб 3: Signers с списком и AddSignerModal`
- `Таб 4: Related (ссылка на сделку)`

## Verification

Открыть /contracts/[id], проверить табы, модалки
