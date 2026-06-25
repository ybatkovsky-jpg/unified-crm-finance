---
estimated_steps: 6
estimated_files: 1
skills_used: []
---

# T05: Category UI — Detail page

Создать детальную страницу категории в apps/web/src/app/finance/categories/[id]/page.tsx:
- Детальная информация: name, type, parent, order, createdAt, updatedAt
- Кнопка Edit → modal форма
- Кнопка Delete (deactivate) с confirm
- Список дочерних категорий (если есть)

Следовать pattern из apps/web/src/app/procurement/counterparties/[id]/page.tsx

## Inputs

- `apps/web/src/lib/api/categories.ts`
- `apps/web/src/app/finance/categories/page.tsx`

## Expected Output

- `apps/web/src/app/finance/categories/[id]/page.tsx`

## Verification

curl -f http://localhost:3000/finance/categories/{id} || true
