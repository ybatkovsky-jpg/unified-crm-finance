# Research: Contract List and Detail Pages (S05)

## Slice Goal
Create `/contracts` list page and `/contracts/[id]` detail page with versions and signers display.

## Existing API Layer (From S04)

### Contract API Endpoints
All contract API routes are already implemented in S04:

- `GET /api/contracts` - List contracts with filters (status, contactId, dealId)
- `POST /api/contracts` - Create contract
- `GET /api/contracts/[id]` - Single contract with relations (contact, deal, template, versions, signers)
- `PATCH /api/contracts/[id]` - Update contract
- `DELETE /api/contracts/[id]` - Soft delete
- `GET/POST /api/contracts/[id]/versions` - List/add versions
- `GET/POST /api/contracts/[id]/signers` - List/add signers

### Repository (`apps/web/src/lib/db/contracts.ts`)
- `ContractRepository` class with full CRUD
- `findMany()`, `findUnique()`, `create()`, `update()`, `softDelete()`
- `getVersions()`, `addVersion()`
- `getSigners()`, `addSigner()`
- `convertFromDeal()` - for deal-to-contract conversion

### API Client (`apps/web/src/lib/api/contracts.ts`)
- `ContractApiClient` class
- Methods: `getContracts`, `getContract`, `createContract`, `updateContract`, `deleteContract`, `getVersions`, `addVersion`, `getSigners`, `addSigner`, `convertDeal`

### Types (`apps/web/src/lib/api/types.ts`)
```typescript
ContractData = Contract with { contact?, deal?, template?, versions[], signers[] }
ContractVersionData = Omit<ContractVersion, 'contractId'>
ContractSignerData = Omit<ContractSigner, 'contractId'>
ContractListParams = { status?, contactId?, dealId? }
```

## Prisma Models

### Contract Model
- Fields: `id`, `number`, `dealId` (unique), `contactId`, `templateId`, `title`, `amount`, `currency`, `startDate`, `endDate`, `signedAt`, `status`, `signedFileId`, `notes`, `attributes`, `createdAt`, `updatedAt`, `deletedAt`
- Relations: `Contact`, `Deal`, `ContractTemplate`, `ContractSigner[]`, `ContractVersion[]`

### ContractVersion Model
- Fields: `id`, `contractId`, `version`, `contentMd`, `generatedPdfFileId`, `createdBy`, `createdAt`

### ContractSigner Model
- Fields: `id`, `contractId`, `name`, `position`, `signedAt`, `signatureFileId`

## Existing UI Patterns to Follow

### List Page Pattern (`apps/web/src/app/deals/page.tsx` & `apps/web/src/app/crm/contacts/page.tsx`)
- Client component with useState/useEffect
- Loading spinner with RefreshCwIcon
- Error state with retry button
- Empty state message
- Filter bar (Contact page uses shadcn Select components)
- Table or card-based display
- Link to detail pages via `<Link href="/path/[id]">`

### Detail Page Pattern (`apps/web/src/app/deals/[id]/page.tsx` & `apps/web/src/app/crm/contacts/[id]/page.tsx`)
- Client component with async params unwrapping
- Back navigation with arrow icon
- Header with title and badges (status badges)
- Edit mode toggle (Deal page has inline editing)
- Card-based sections using `Card`, `CardHeader`, `CardTitle`, `CardContent`
- Related entities section with links
- Metadata sidebar
- `ApiClientError` handling for 404 and general errors

### Available UI Components
All in `apps/web/src/components/ui/`:
- `badge.tsx` - For status badges
- `button.tsx` - Action buttons
- `card.tsx` - Content containers
- `dialog.tsx` - For modals
- `input.tsx` - Form inputs
- `label.tsx` - Form labels
- `select.tsx` - Dropdown filters
- `table.tsx` - For list views
- `textarea.tsx` - Multi-line input

## Files to Create

### 1. List Page
**Path:** `apps/web/src/app/contracts/page.tsx`

**Purpose:** Display all contracts in a table with filtering

**Key features:**
- Filter by status (draft, active, expired, etc.)
- Show: Number, Title, Contact, Amount, Status, Dates
- Link to detail page `/contracts/[id]`
- Create contract button (can reuse S04 patterns or defer)

**Dependencies:**
- `contractsApi.getContracts()` from `@/lib/api/contracts`
- `ContractData`, `ContractListParams` from `@/lib/api/types`
- UI components: Table, Button, Card, Select, Badge

### 2. Detail Page
**Path:** `apps/web/src/app/contracts/[id]/page.tsx`

**Purpose:** Show contract details with versions and signers

**Key sections:**
- Header: Number, Title, Status badges, Back button
- Contract details: Amount, Currency, Start/End dates, Signed date
- Related entities: Contact link, Deal link (if any)
- Versions section: List of versions with version number, date, creator
- Signers section: List of signers with name, position, signed status

**Dependencies:**
- `contractsApi.getContract()`, `contractsApi.getVersions()`, `contractsApi.getSigners()`
- Same UI components as list page

## Data Requirements

### Contract Status Values
Based on the Prisma schema default, contracts have `status` field with default "draft".
Common statuses would be:
- `draft` - Черновик
- `active` - Действует
- `expired` - Истек
- `terminated` - Расторгнут
- `signed` - Подписан

We should support filtering by these statuses on the list page.

## Verification Plan

1. **List Page Verification**
   - Navigate to `/contracts` - should show table of contracts
   - Apply status filter - should filter results
   - Click contract row - should navigate to detail page
   - Empty state - should show message when no contracts

2. **Detail Page Verification**
   - Navigate to `/contracts/[id]` - should show contract details
   - Verify related Contact link works
   - Verify related Deal link works (if dealId exists)
   - Check Versions section displays version list
   - Check Signers section displays signers list
   - 404 handling for invalid contract ID

## Natural Seams / Task Breakdown

1. **Task 1: Contract List Page** (`apps/web/src/app/contracts/page.tsx`)
   - Create page component
   - Add state management (contracts, loading, error, filters)
   - Implement filter bar
   - Build table with contract rows
   - Add loading/error/empty states

2. **Task 2: Contract Detail Page** (`apps/web/src/app/contracts/[id]/page.tsx`)
   - Create page component with async params
   - Add state management
   - Build header with badges
   - Create contract details card
   - Add related entities section
   - Build versions section
   - Build signers section
   - Add error states including 404

## Constraints

1. API is already built - no backend work needed
2. Should follow existing visual patterns from Deals and Contacts pages
3. Use existing UI components from `@/components/ui/`
4. Russian language for UI text (consistent with Deals page)
5. Contract numbers are auto-generated in format `Д-YYYY-NNNNN`
6. Contracts are soft-deleted (filtered by deletedAt: null)

## Surprises / Findings

1. **Full relations included:** The GET `/api/contracts/[id]` endpoint already includes `contact`, `deal`, `template`, `versions`, and `signers` - no additional API calls needed for detail page.

2. **No existing `/contracts` directory:** The directory structure shows `crm/` and `deals/` but no `contracts/` yet - we need to create the full directory.

3. **Inline editing pattern:** The Deal detail page has inline editing - we may want to include this for contracts (status updates, notes edits) or defer to later slice.

4. **Versions and Signers API:** Separate endpoints exist for versions and signers at `/api/contracts/[id]/versions` and `/api/contracts/[id]/signers` - these can be used if we want to add creation UI, but for read-only display we can use the data already included in the main contract response.

5. **No contract component directory yet:** Unlike `components/deals/` and `components/crm/`, there is no `components/contracts/` directory. We may need to create reusable components if the list/detail pages become complex.