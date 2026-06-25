---
estimated_steps: 20
estimated_files: 3
skills_used: []
---

# T04: BOM Section UI — Excel upload, editable table, supplier assignment, lock

Why: User-facing BOM management UI. The core value prop of S02 is Excel→BOM parsing + editing. This task creates all BOM UI components and integrates them into the project detail page.

Do:
1. Install xlsx npm package: cd apps/web && npm install xlsx
2. Create apps/web/src/components/procurement/bom-section.tsx — main client component:
   - Fetches BOM for project via bomApi.getBOM(projectId) on mount
   - If no BOM exists: shows "Create BOM" button + Excel upload dropzone (reuses FileUpload component)
   - Excel upload flow: file uploaded to /api/files → client-side parse with XLSX.read + sheet_to_json → show parsed rows preview → confirm → POST /api/bom with items
   - Column mapping: match Excel headers against known patterns (наименование/name→name, количество/qty→quantity, ед.изм/unit→unit, цена/price→price, артикул/article→article, категория/category→category)
   - If BOM exists: shows editable table of BOM items with columns: Row#, Name (editable), Article, Category, Qty (editable), Unit (editable), Price (editable), Total (qty*price), Supplier (Select dropdown), Status badge, Actions (delete)
   - Inline edit: click cell→input, Enter/blur saves via bomApi.updateBOMItem()
   - Supplier dropdown: fetches from GET /api/counterparties?type=supplier, shows name+INN
   - Lock/Unlock button: calls bomApi.lockBOM(id)/unlockBOM(id), disabled state on lock
   - Loading/error/empty states
   - Add row button to manually add BOMItem
3. Modify apps/web/src/app/projects/[id]/page.tsx:
   - Import BOMSection component
   - Add BOM Section Card after Production section and before File Attachments section
   - Pass projectId prop to BOMSection
   - Card header: "Спецификация (BOM)" with Package icon

Done when: TypeScript compiles without new errors. Manual verification: project detail page shows BOM section card. Component handles all states (no BOM→create, has BOM→edit, locked→readonly).

## Inputs

- `apps/web/src/lib/api/bom.ts`
- `apps/web/src/lib/api/counterparties.ts`
- `apps/web/src/components/shared/file-upload.tsx`
- `apps/web/src/components/ui/tabs.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/table.tsx`
- `apps/web/src/app/projects/[id]/page.tsx`
- `apps/web/src/lib/api/types.ts`

## Expected Output

- `apps/web/src/components/procurement/bom-section.tsx`

## Verification

npx tsx --test src/lib/db/bom.test.ts
