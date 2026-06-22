# Research: Slice S03 - Project List + Create UI

## Summary

Slice S03 requires building the project list page and create project modal. The backend foundation (ProjectRepository, ProjectApiClient, API routes) is complete from S02. The UI should follow established patterns from deals and contacts modules: table-based list with filters (status, manager), CreateProjectModal with contact/contract/deal selection, and shadcn/ui components. This is light research — the technology stack and patterns are well-established in the codebase.

## Recommendation

Use the Contracts list page (`apps/web/src/app/contracts/page.tsx`) as the primary template since it has multiple filters (status + contact), similar to what Projects needs (status + manager). Reuse CreateDealModal pattern for CreateProjectModal with form fields: name, description, contactId, dealId, contractId, managerId, status, currency/amount, dates. Build projects list at `apps/web/src/app/projects/page.tsx` and CreateProjectModal at `apps/web/src/components/projects/create-project-modal.tsx`. No new dependencies needed.

## Implementation Landscape

### Key Files

| File | Purpose | Pattern to Reuse |
|------|---------|------------------|
| `apps/web/src/app/contracts/page.tsx` | List page with dual filters (status + contact) | Filter layout, table structure, state management |
| `apps/web/src/app/crm/contacts/page.tsx` | Simpler list with filter | Base list pattern, loading/error states |
| `apps/web/src/components/deals/create-deal-modal.tsx` | Modal form with contact selection | Dialog pattern, form state, searchable contacts |
| `apps/web/src/lib/api/projects.ts` | ProjectApiClient (from S02) | getProjects, createProject methods |
| `apps/web/src/lib/api/types.ts` | Project types (from S02) | ProjectData, ProjectCreateInput, ProjectListParams |

### Build Order

1. **Projects List Page**: Create `apps/web/src/app/projects/page.tsx` using contracts/page.tsx template
2. **CreateProjectModal**: Create `apps/web/src/components/projects/create-project-modal.tsx` using create-deal-modal.tsx template
3. **FilterBar Component**: Create `apps/web/src/components/projects/filter-bar.tsx` for status/manager filters (reusable from deals)

### Project Schema (from S02)

Project fields for UI:
- `id`: UUID
- `externalNumber`: Unique string (user input or auto)
- `name`: Title
- `description`: Optional text
- `status`: Default "lead" — filter by this
- `contactId`: Link to Contact
- `dealId`: Link to Deal (unique)
- `contractId`: Link to Contract (unique)
- `managerId`: Link to User — filter by this
- `contractAmount`: Number
- `currency`: Default "RUB"
- `startDate`, `endDate`: Dates
- `marginTarget`: Default 0.25

### Status Filter Options

From schema default: `status: "lead"`. Likely values based on milestone context:
- `lead` — начальный
- `active` — в работе
- `completed` — завершён
- `paused` — приостановлен

(Will need to confirm with existing code or user if other statuses exist)

### Manager Filter

Uses `User` relation via `managerId`. Should fetch users for filter dropdown. May need a simple users API or hardcode for MVP.

## Verification Approach

- Manual test: Navigate to `/projects` (should create or use `/projects` route)
- Test filters: status and manager dropdowns work
- Test create modal: form submits, project appears in list
- Test table rows: click to navigate to detail (will be S04)

## Constraints

- Next.js 16, React 19, TypeScript strict mode
- shadcn/ui components already available
- ProjectApiClient fully tested from S02
- Russian language UI (existing patterns use Russian labels)

## Common Pitfalls

1. **Manager filter**: No users API yet — may need to mock or use existing User data from deals/contacts
2. **External number**: Project uses `externalNumber` (not `number` like Deal) — ensure form uses correct field name
3. **Unique constraints**: `dealId` and `contractId` are unique — form should allow only one or none
4. **Date handling**: `startDate`, `endDate` are optional — use standard date input format (YYYY-MM-DD)

## Open Risks

- **Users API**: No users list endpoint exists for manager filter dropdown. May need to create one or hardcode managers for S03.
- **Status values**: Project status enum not documented in schema. May need to infer from milestone context or seed data.
- **Navigation**: No `/projects` route exists yet. Need to verify routing structure.

## Skills Discovered

No additional skills needed. UI patterns are well-established locally.
