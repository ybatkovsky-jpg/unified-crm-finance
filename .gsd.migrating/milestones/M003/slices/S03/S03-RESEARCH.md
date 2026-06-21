# S03: Deal Detail Page - Research

## Goal

Create a detailed page for deals at `/deals/[id]` that shows deal information, history timeline (DealHistory), related contacts, tasks, and events.

## Existing State

### Deal API (S01 Completed)

**Repository**: `apps/web/src/lib/db/deals.ts`
- `DealRepository` class with methods: `findMany`, `findUnique`, `findBy*`, `create`, `update`, `moveStage`, `softDelete`, `count`, `getHistory`
- `moveStage(dealId, toStageId, changedBy, comment)` creates `DealHistory` entries
- `getHistory(dealId)` returns `DealHistory[]` ordered by `changedAt DESC`

**API Endpoints**:
- `GET /api/deals` - List deals with filters (pipelineId, stageId, managerId, contactId, status)
- `GET /api/deals/[id]` - Fetch single deal (already includes `history` in response - see below)
- `PATCH /api/deals/[id]` - Update deal fields (title, amount, currency, expectedCloseDate, description, lossReason, attributes, contactId, managerId)
- `DELETE /api/deals/[id]` - Soft delete
- `POST /api/deals/[id]/move` - Move deal between stages

**Key Finding**: The `GET /api/deals/[id]` endpoint already includes history in the response:
```typescript
// apps/web/src/app/api/deals/[id]/route.ts line 33-42
const deal = await deals.findUnique(id, {
  include: {
    stage: true,
    pipeline: true,
    contact: true,
    manager: true,
    history: {
      orderBy: { changedAt: 'desc' },
    },
  },
})
```

This is already sufficient for displaying deal history.

### Database Models

**DealHistory** (schema.prisma lines 365-376):
```prisma
model DealHistory {
  id          String   @id
  dealId      String
  fromStageId String?
  toStageId   String?
  comment     String?
  changedBy   String
  changedAt   DateTime @default(now())
  Deal        Deal     @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, changedAt])
}
```

**Task** (schema.prisma lines 851-881):
```prisma
model Task {
  id                         String    @id
  title                      String
  description                String?
  type                       String    @default("client")
  status                     String    @default("todo")
  priority                   String    @default("medium")
  dueDate                    DateTime?
  completedAt                DateTime?
  contactId                  String?
  projectId                  String?
  dealId                     String?   // <-- Deal relation exists
  assigneeId                 String?
  createdBy                  String
  createdAt                  DateTime  @default(now())
  updatedAt                  DateTime
  deletedAt                  DateTime?
  Deal                       Deal?     @relation(fields: [dealId], references: [id])
  // ... other relations
}
```

**Event** (schema.prisma lines 435-468):
```prisma
model Event {
  id              String           @id
  googleEventId   String?          @unique
  title           String
  description     String?
  location        String?
  isAllDay        Boolean          @default(false)
  startAt         DateTime
  endAt           DateTime
  status          String           @default("confirmed")
  eventType       String           @default("meeting")
  recurrenceId    String?
  recurrenceRule  String?
  contactId       String?
  projectId       String?
  dealId          String?          // <-- Deal relation exists
  createdBy       String
  createdAt       DateTime         @default(now())
  updatedAt       DateTime
  deletedAt       DateTime?
  Deal            Deal?            @relation(fields: [dealId], references: [id])
  // ... other relations
}
```

**Deal** (schema.prisma lines 329-363):
```prisma
model Deal {
  id                String        @id
  number            String        @unique
  title             String
  pipelineId        String
  stageId           String
  contactId         String?
  amount            Float         @default(0)
  currency          String        @default("RUB")
  expectedCloseDate DateTime?
  actualCloseDate   DateTime?
  managerId         String?
  description       String?
  lossReason        String?
  attributes        Json?
  contractId        String?       @unique
  projectId         String?       @unique
  createdAt         DateTime      @default(now())
  updatedAt         DateTime
  closedAt          DateTime?
  deletedAt         DateTime?
  User              User?         @relation(fields: [managerId], references: [id])
  Contact           Contact?      @relation(fields: [contactId], references: [id])
  DealStage         DealStage     @relation(fields: [stageId], references: [id])
  Pipeline          Pipeline      @relation(fields: [pipelineId], references: [id])
  DealHistory       DealHistory[]
  Event             Event[]
  Task              Task[]
}
```

### Existing Deal Detail Page

**Location**: `apps/web/src/app/deals/[id]/page.tsx`

Current state (already exists from S02):
- Basic deal details display with edit mode
- Shows: title, number, stage, pipeline, amount, currency, dates, description, loss reason
- Related entities: Contact (link to `/crm/contacts/[id]`), Manager
- Stage info sidebar with probability
- Metadata (created/updated dates)

**What's missing for S03**:
1. DealHistory timeline component
2. Tasks related to this deal
3. Events related to this deal
4. API endpoints for fetching tasks/events by dealId

### Contact Detail Page Pattern (M002)

**Location**: `apps/web/src/app/crm/contacts/[id]/page.tsx`

Key pattern for S03:
- Uses `InteractionTimeline` component from `components/crm/interaction-timeline.tsx`
- Uses `InteractionForm` component for creating new interactions
- Timeline refresh mechanism via `key` prop
- API client pattern with `contactsApi.getContact(contactId)`

The InteractionTimeline component is a good reference for building DealHistoryTimeline.

### API Client Types

**Location**: `apps/web/src/lib/api/types.ts`

Relevant types:
- `DealData` extends Deal with `stage`, `pipeline`, `contact`, `manager` relations
- **Note**: `DealData` does NOT currently include `history` array
- `DealHistory` exists in Prisma but not exposed in API client types

### Missing Components

1. **DealHistory Timeline Component** (to be created)
   - Similar to `InteractionTimeline`
   - Shows stage changes with from/to, comment, changedBy, changedAt

2. **Task List Component** (to be created)
   - Tasks filtered by `dealId`
   - No Task repository/API exists yet

3. **Event List Component** (to be created)
   - Events filtered by `dealId`
   - No Event repository/API exists yet

4. **API Types** (to be extended)
   - Add `DealHistoryData` type
   - Extend `DealData` to include `history?: DealHistoryData[]`

5. **API Endpoints** (if needed beyond what already exists)
   - `GET /api/deals/[id]/tasks` - List tasks for this deal
   - `GET /api/deals/[id]/events` - List events for this deal

## Constraints

1. **DealHistory is already included in GET /api/deals/[id] response** - No new endpoint needed, just need to:
   - Add `history` to `DealData` type
   - Create timeline component to display it

2. **Tasks and Events**:
   - Database relations exist (`dealId` on both Task and Event)
   - No repositories/API clients exist for these entities yet
   - For S03 scope, may need minimal implementation or defer to future slices

3. **Component Pattern**:
   - Follow existing patterns from Contact detail page
   - Use `InteractionTimeline` as template for `DealHistoryTimeline`

## Natural Seams / Work Units

1. **Add DealHistory to types** (`apps/web/src/lib/api/types.ts`)
   - Add `DealHistoryData` type
   - Extend `DealData` with `history?: DealHistoryData[]`

2. **Create DealHistoryTimeline component** (`apps/web/src/components/deals/deal-history-timeline.tsx`)
   - Display stage changes chronologically
   - Show from stage, to stage, comment, who changed, when
   - Similar to `InteractionTimeline` pattern

3. **Update Deal Detail Page** (`apps/web/src/app/deals/[id]/page.tsx`)
   - Add DealHistoryTimeline section
   - Style consistent with existing UI

4. **Optional (if time permits)**: Task/Event sections
   - Would require repositories and API endpoints
   - Lower priority for core deal detail functionality

## First Proof / Highest Risk

**Risk is low** - Most foundation exists. The main work is:

1. Type extension (safe, trivial)
2. Timeline component (straightforward, pattern exists)
3. Page update (minimal changes to existing working code)

No database changes needed. DealHistory already flows through GET /api/deals/[id].

## Verification

1. Navigate to `/deals/[id]` for a deal with history
2. History timeline should show all stage changes
3. Each entry shows: from stage, to stage, date, who changed, comment
4. Timeline is ordered chronologically (most recent first)
5. Contact link still works
6. Edit/save still works

## Files to Modify/Create

### Modify
- `apps/web/src/lib/api/types.ts` - Add DealHistoryData, extend DealData
- `apps/web/src/app/deals/[id]/page.tsx` - Add history timeline section

### Create
- `apps/web/src/components/deals/deal-history-timeline.tsx` - Timeline component

### Optional Create (if including tasks/events)
- `apps/web/src/lib/db/tasks.ts` - TaskRepository
- `apps/web/src/lib/db/events.ts` - EventRepository
- `apps/web/src/lib/api/tasks.ts` - Task API client
- `apps/web/src/lib/api/events.ts` - Event API client
- `apps/web/src/app/api/tasks/route.ts` - Task API endpoints
- `apps/web/src/app/api/events/route.ts` - Event API endpoints
- `apps/web/src/components/deals/deal-tasks.tsx` - Tasks list
- `apps/web/src/components/deals/deal-events.tsx` - Events list