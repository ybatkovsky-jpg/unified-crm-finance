---
estimated_steps: 4
estimated_files: 1
skills_used: []
---

# T01: Add DealHistory stage relations to API response

The GET /api/deals/[id] endpoint currently includes `history` but doesn't fetch the related DealStage records (fromStage, toStage) needed by DealHistoryTimeline. Update the Prisma include to fetch these relations.

**Why:** DealHistoryTimeline needs fromStage.name and toStage.name to display stage transitions (e.g., "Lead → Qualification"). Without these relations, the timeline can't show meaningful stage names.

**Do:** Modify the Prisma include in `apps/web/src/app/api/deals/[id]/route.ts` to include `history: { include: { fromStage: true, toStage: true } }`.

**Done when:** The API returns history entries with nested fromStage and toStage objects containing name fields.

## Inputs

- `apps/web/src/app/api/deals/[id]/route.ts`
- `apps/web/src/lib/api/deals.test.ts`

## Expected Output

- `apps/web/src/app/api/deals/[id]/route.ts`

## Verification

cd apps/web && npx tsx --test src/lib/api/deals.test.ts 2>&1 | grep -E '(PASS|FAIL|passed|failed)'

## Observability Impact

None - this is a data fetch change, not observability. The timeline component handles loading/error states already.
