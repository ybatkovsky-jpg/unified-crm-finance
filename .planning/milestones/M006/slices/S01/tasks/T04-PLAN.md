---
estimated_steps: 7
estimated_files: 2
skills_used: []
---

# T04: Category UI — List page

Создать список категорий в apps/web/src/app/finance/categories/page.tsx:
- Table с колонками: Name, Type, Parent, Order, Status
- Отступ для дочерних категорий ( Nested по parentId)
- Фильтры: Type (income/expense/all), Status (active/inactive/all)
- Create button → modal форма
- Actions: edit, delete (deactivate)

Следовать pattern из apps/web/src/app/procurement/counterparties/page.tsx

## Inputs

- `apps/web/src/lib/api/categories.ts`

## Expected Output

- `apps/web/src/app/finance/categories/page.tsx`
- `apps/web/src/components/finance/category-form.tsx`

## Verification

curl -f http://localhost:3000/finance/categories || true
