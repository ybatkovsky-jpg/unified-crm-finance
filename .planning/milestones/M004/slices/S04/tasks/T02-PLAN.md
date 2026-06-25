---
estimated_steps: 54
estimated_files: 1
skills_used: []
---

# T02: Create Project Detail Page with stages, members, and related entities

## Why
Users need to view full project details including stages, team members, and related Deal/Contract. The detail page completes the Project module CRUD UI.

## Do
1. Create apps/web/src/app/projects/[id]/page.tsx:
   - Use "use client" directive
   - Import useRouter, ArrowLeft, Edit2, Save, X, Link as LinkIcon, Calendar, DollarSign, Building2, User, FileText icons
   - Import projectsApi, ApiClientError, ProjectData, and UI components (Card, Badge, Button, Input, Label, Textarea, Select, Table)
   - Use async params pattern: params: Promise<{ id: string }>, unwrapParams callback
2. Implement state: project, loading, error, isEditing, saving, editForm
3. fetchProject callback:
   - Call projectsApi.getProject(id)
   - Set project and editForm state with date formatting (toISOString().split('T')[0])
4. Header section:
   - Back button with router.back()
   - Title and status badge (inline style color per status)
   - Edit button (hidden when editing)
5. Loading state: centered "Loading project..." text
6. Error state: Card with destructive error text and back button
7. Main grid layout (lg:grid-cols-3):
   - Main column (lg:col-span-2):
     - Project Details Card with read/edit modes
       - Read mode: externalNumber, name, description, dates, amounts, margin
       - Edit mode: form inputs for all fields with save/cancel buttons
     - Stages List Card:
       - Table with columns: code, name, status, start date, end date, assignee
       - Empty state when no stages
     - Members List Card:
       - Table with columns: user name, role, joined date
       - Empty state when no members
     - Related Entities Card:
       - Contact link to /crm/contacts/[id]
       - Deal link to /deals/[id]
       - Contract link to /contracts/[id]
       - Show "—" when null
   - Sidebar:
     - Status Card: colored box showing project status
     - Metadata Card: created/updated dates
8. Edit functionality:
   - handleSave calls projectsApi.updateProject with editForm fields
   - handleCancel resets editForm from project state
   - Disable save button while saving
9. Use Russian labels (similar to contracts/[id]/page.tsx):
   - "Детали проекта" for Project Details
   - "Этапы проекта" for Stages
   - "Команда" for Members
   - "Связанные сущности" for Related Entities
   - "Статус" for Status
   - "Метаданные" for Metadata
10. Status colors (same pattern as Contract detail):
    - lead: #94a3b8, active: #22c55e, completed: #3b82f6, paused: #f97316

## Done when
- Page renders at /projects/[id] with all sections visible
- Edit mode saves and updates project data
- Related entity links navigate to correct detail pages

## Inputs

- `apps/web/src/lib/api/projects.ts`
- `apps/web/src/lib/api/types.ts`
- `apps/web/src/app/deals/[id]/page.tsx`
- `apps/web/src/app/contracts/[id]/page.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/label.tsx`
- `apps/web/src/components/ui/textarea.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/table.tsx`

## Expected Output

- `apps/web/src/app/projects/[id]/page.tsx`

## Verification

npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "projects/[id]/page.tsx" || echo "TypeScript OK"
