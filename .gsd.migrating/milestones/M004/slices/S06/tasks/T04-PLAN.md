---
estimated_steps: 17
estimated_files: 1
skills_used: []
---

# T04: Create Production Modal Component

Build CreateProductionModal component following CreateProjectModal pattern.

Create apps/web/src/components/projects/create-production-modal.tsx:
- Dialog with form fields: type (PLATE/COUNTERTOP select), plannedStartDate, plannedEndDate, notes
- Validates required fields (type, dates)
- On submit: calls ProductionApiClient.createProduction() with projectId and type in attributes
- After creation: auto-creates 8 standard production stages via API
- Russian labels: 'Тип производства', 'Плановая дата начала', 'Плановая дата окончания', 'Заметки'
- Production types: 'PLATE' -> 'Плитные материалы', 'COUNTERTOP' -> 'Столешницы'

Standard stages to auto-create (defined as const):
1. ЗАКАЗ_МАТЕРИАЛОВ (Заказ материалов)
2. ПОСТУПЛЕНИЕ (Поступление на склад)
3. РАСКРОЙ (Раскрой)
4. ПОЛИРОВКА (Полировка)
5. КОНТРОЛЬ_КАЧЕСТВА (Контроль качества)
6. УПАКОВКА (Упаковка)
7. ДОСТАВКА (Доставка)
8. МОНТАЖ (Монтаж)

## Inputs

- `apps/web/src/components/projects/create-project-modal.tsx`
- `apps/web/src/lib/api/productions.ts`

## Expected Output

- `apps/web/src/components/projects/create-production-modal.tsx`

## Verification

npx tsc --noEmit 2>&1 | grep -q 'create-production-modal' || echo 'TypeScript OK'
