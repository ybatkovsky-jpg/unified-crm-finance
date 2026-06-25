# Research: Slice S04 - Project Detail Page

## Summary

Slice S04 requires building a Project Detail Page at `/projects/[id]` that displays project information, stages list, team members with roles, and related Deal/Contract entities. The backend API from S02 already provides the data structure, but there are two gaps: the API GET endpoint at `/api/projects/[id]/route.ts` does not include Deal and Contract relations (only Contact and User), and the Prisma schema has a missing relation (Deal has `projectId` field but no back-relation to Project, same for Contract). The implementation should follow established patterns from Deal Detail (`/deals/[id]/page.tsx`) and Contract Detail (`/contracts/[id]/page.tsx`).

## Key Findings

### Existing Patterns to Reuse

1. **Detail Page Layout** - `deals/[id]/page.tsx` and `contracts/[id]/page.tsx` use:
   - Back navigation button with `router.back()`
   - Header with title, badge status, and edit button
   - Loading, error, and empty states
   - Main content with cards in grid layout (lg:col-span-2 for main, col-span-1 for sidebar)
   - `useCallback` for params unwrapping (async params pattern in Next.js 16)
   - Edit mode with form inputs (editForm state, handleSave, handleCancel)

2. **Contract Detail Uses Tabs** - `contracts/[id]/page.tsx` has:
   - `Tabs` component with TabsList, TabsTrigger, TabsContent
   - Separate tabs for Details, Versions, Signers, Related entities
   - Modal dialogs for adding nested entities (versions, signers)

3. **Related Entities Section** - Both Deal and Contract detail pages have:
   - Card with "Связанные сущности" (Related Entities) title and LinkIcon
   - Links to Contact (`/crm/contacts/[id]`) and Deal (`/deals/[id]`)
   - Consistent pattern: icon + entity type label + clickable link

4. **Status Badge Pattern** - Status badges use inline styles for dynamic colors:
   ```tsx
   <Badge style={{ backgroundColor: stageColor, color: "#fff" }}>
   ```

### Data Structure from S02

- **ProjectData** type includes: manager, contact, deal, contract, stages, members
- **ProjectStageData** includes: code, name, order, status, startDate, endDate, completedAt, assigneeId, notes
- **ProjectMemberData** includes: userId, role, joinedAt, leftAt + User relation (id, name, email)

### API Gaps Discovered

1. **Missing Deal/Contract Relations in GET Response**
   - File: `apps/web/src/app/api/projects/[id]/route.ts`
   - Current include: ProjectStage, ProjectMember (with User), Contact, User
   - Missing: Deal, Contract relations
   - This is critical for the detail page to show linked Deal/Contract

2. **Prisma Schema Missing Back-Relations**
   - Project has `dealId` and `contractId` fields (foreign keys)
   - Deal has `projectId` field but no `@relation` back to Project
   - Contract has no `projectId` field at all
   - This means Prisma won't auto-include these relations without manual queries

### Routing Pattern

- List page uses: `<Link href={/projects/${project.id}}>`
- Detail page at: `apps/web/src/app/projects/[id]/page.tsx`
- Params are async in Next.js 16: `params: Promise<{ id: string }>`

## Implementation Landscape

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/app/projects/[id]/page.tsx` | Project detail page with info, stages, members, related entities |
| `apps/web/src/components/projects/project-stage-list.tsx` | Optional: reusable component for stages table |
| `apps/web/src/components/projects/project-members-list.tsx` | Optional: reusable component for members table |

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/src/app/api/projects/[id]/route.ts` | Add Deal and Contract to include clause |
| `apps/web/src/lib/api/types.ts` | Verify ProjectData includes deal, contract (already defined) |

### Build Order

1. **Fix API include** - Update `/api/projects/[id]/route.ts` to include Deal and Contract relations
2. **Create detail page** - Build `/projects/[id]/page.tsx` with:
   - Header (back button, title, status badge, edit button)
   - Loading/error states
   - Main grid layout
   - Project details card
   - Stages list card
   - Members list card
   - Related entities card (Contact, Deal, Contract links)
3. **Optional components** - Extract reusable stage/member components if beneficial

### Page Layout (Based on Contract Detail)

```
Header
├── Back button
├── Title + Status Badge
└── Edit button

Main Grid (lg:grid-cols-3)
├── Main Column (lg:col-span-2)
│   ├── Project Details Card
│   │   ├── Read view: externalNumber, name, description, dates, amounts, margin
│   │   └── Edit view: form inputs for all fields
│   ├── Stages List Card
│   │   └── Table: code, name, status, dates, assignee
│   ├── Members List Card
│   │   └── Table: user, role, joined date
│   └── Related Entities Card
│       └── Contact, Deal, Contract links
└── Sidebar (col-span-1)
    ├── Status Card
    └── Metadata Card
```

## Don't Hand-Roll

| Feature | Use Existing |
|---------|--------------|
| Status Badge | shadcn/ui Badge with inline style for color |
| Date Formatting | `new Date(date).toLocaleDateString("ru-RU")` |
| Currency Formatting | `Intl.NumberFormat("ru-RU", { style: "currency", currency })` |
| Tabs | `@/components/ui/tabs` (Tabs, TabsList, TabsTrigger, TabsContent) |
| Table | `@/components/ui/table` |
| Edit Mode | Local state: `isEditing`, `editForm`, `handleSave`, `handleCancel` |
| Form Inputs | Input, Textarea, Select from @/components/ui |
| Back Navigation | `router.back()` or `router.push('/projects')` |

## Constraints

- Next.js 16 with App Router (async params)
- React 19 ("use client" directive for client components)
- TypeScript strict mode
- Russian language UI (existing pages use Russian labels)
- Project.status values: lead, active, completed, paused
- ProjectStage.status values: pending, in_progress, completed, blocked
- ProjectMember.role values: freeform string (no enum in schema)

## Common Pitfalls

1. **Missing Deal/Contract data** - Must update API include before detail page will work
2. **Async params in Next.js 16** - Must use `await params` or `unwrapParams` callback pattern
3. **Prisma relation limits** - Without `@relation` on Deal.projectId, can't use automatic includes
4. **Member unique constraint** - `@@unique([projectId, userId])` means one user = multiple roles via multiple records
5. **Date format inconsistency** - API returns ISO strings, display needs locale formatting
6. **Missing null checks** - Contact, Deal, Contract may be null (optional relations)

## Open Risks

- **Deal/Contract schema limitations** - Missing @relation means manual queries may be needed
- **Stage editing out of scope** - S04 is read-only view (editing stages deferred to future)
- **Member management UI** - Adding/removing members not in S04 scope (view only)

## Verification Approach

- Navigate to `/projects/[id]` for a project with Deal and Contract relations
- Verify all sections render: details, stages, members, related entities
- Test navigation links: Contact → `/crm/contacts/[id]`, Deal → `/deals/[id]`, Contract → `/contracts/[id]`
- Check loading state, error state (404), and empty states (no stages, no members)
- Verify edit mode: form inputs populate correctly, save updates project
