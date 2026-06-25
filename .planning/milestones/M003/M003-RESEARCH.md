# M003 Research: Сделки и контракты

**Date:** 2026-06-21
**Status:** Complete (post-hoc research — milestone already delivered)

## Executive Summary

M003 delivered a complete Deals and Contracts module across 5 slices (S01-S05). The milestone is fully implemented, validated, and R011/R012 are marked validated. This research documents what was built, identifies gaps and risks, and surfaces findings for future milestones (M004-M008).

**Key finding:** The milestone is functionally complete but has no test coverage for deals/contracts, no transaction wrapping in critical operations, and a duplicate milestone ID issue (M003/M009).

---

## 1. What Exists (Implemented)

### Architecture: Three-Layer Pattern

```
API Routes (app/api/)     →  thin HTTP layer, validation, error formatting
Repository (lib/db/)      →  Prisma queries, business logic, soft-delete
API Client (lib/api/)     →  typed fetch wrappers for browser consumption
```

This pattern was established in M002 (Contacts) and consistently applied here.

### S01: Deal Repository & API

**Files:** `lib/db/deals.ts` (263 lines), `app/api/deals/route.ts`, `app/api/deals/[id]/route.ts`, `app/api/deals/[id]/move/route.ts`

- `DealRepository` with: findMany, findUnique, findByPipeline, findByStage, findByManager, findByContact, create, update, moveStage, softDelete, count, getHistory
- Auto-numbering: `С-YYYY-NNNNN` via `Math.random()` — no DB-level uniqueness enforcement, collision possible at scale
- `moveStage` records DealHistory entry before updating stage; auto-sets closedAt/actualCloseDate when moving to won/lost stages
- Singleton export pattern: `export const deals = new DealRepository()`
- API routes: GET/POST /api/deals, GET/PATCH/DELETE /api/deals/[id], POST /api/deals/[id]/move

### S02: Kanban Board UI

**Files:** `components/deals/kanban-board.tsx`, `kanban-column.tsx`, `deal-card.tsx`, `deal-card-draggable.tsx`, `create-deal-modal.tsx`, `filter-bar.tsx`, `app/deals/page.tsx`

- `@dnd-kit/core` for drag-and-drop between pipeline stages
- Deals grouped by stage, rendered as columns with deal count, probability, total amount
- FilterBar with status filter (All/Open/Closed)
- CreateDealModal with title, amount, currency, expected close date, description
- DraggableDealCard wraps DealCard with `useDraggable` hook

### S03: Deal Detail Page & History Timeline

**Files:** `app/deals/[id]/page.tsx` (489 lines), `components/deals/deal-history-timeline.tsx`

- Deal detail with inline editing, stage badge, contact link, manager info
- DealHistoryTimeline showing fromStage → toStage transitions with timestamps, user, and comments
- "Convert to Contract" button (added as post-validation fix)

### S04: Contract Repository & API

**Files:** `lib/db/contracts.ts` (290 lines), `app/api/contracts/route.ts`, `app/api/contracts/[id]/route.ts`, `app/api/contracts/[id]/versions/route.ts`, `app/api/contracts/[id]/signers/route.ts`, `app/api/deals/[id]/convert/route.ts`

- `ContractRepository` with: findMany, findUnique, findByContact, findByDeal, create, update, softDelete, count, addVersion, getVersions, addSigner, getSigners, convertFromDeal
- Auto-numbering: `Д-YYYY-NNNNN`
- `addVersion` auto-increments version number (queries latest, adds 1)
- `convertFromDeal` creates Contract from Deal data, sets bidirectional link (deal.contractId, contract.dealId), throws if contract already exists
- API routes: full CRUD + versions sub-resource + signers sub-resource + convert endpoint

### S05: Contract Pages

**Files:** `app/contracts/page.tsx` (273 lines), `app/contracts/[id]/page.tsx` (732 lines)

- Contract list with searchable contact filter, status filter (draft/active/expired/terminated)
- Contract detail with tabbed interface: Details, Versions, Signers, Related
- Inline editing, version creation modal, signer addition modal
- No dedicated contract UI components — all logic inline in page files (732 lines is large)

### Seed Data

- `prisma/seed.ts`: Creates 1 default pipeline with 8 stages (new → qualified → meeting → proposal → negotiation → contract → won/lost), plus roles, admin user, lead sources, financial categories
- `prisma/seed-deals.ts`: Standalone pipeline + stages seed using fixed IDs

---

## 2. Code Quality & Risk Assessment

### Critical: No Transaction Wrapping

**Risk: MEDIUM** — Data inconsistency possible under concurrent access or mid-operation failures.

- `DealRepository.moveStage` (deals.ts:165-215): Creates DealHistory, then updates deal stage, then optionally sets closedAt. If stage update fails after history creation, orphaned history record exists.
- `ContractRepository.convertFromDeal` (contracts.ts:243-281): Creates contract, then updates deal. If deal update fails, orphaned contract exists.
- Neither method uses `prisma.$transaction()` for atomicity. SQLite supports transactions but Prisma's interactive transactions require `prisma.$transaction([...])` with the sqlite provider.

**Recommendation:** Wrap multi-step mutations in `prisma.$transaction()` for future milestones.

### Medium: Auto-Numbering Collision Risk

**Risk: LOW** — Only problematic at scale (>100k records).

- `generateNumber()` uses `Math.random()` without checking DB uniqueness
- The `number` field has a UNIQUE constraint on the DB — Prisma will throw on collision, but no retry logic
- Current scale makes collision unlikely, but production at 100k+ deals could hit it

### Medium: No Test Coverage

**Risk: MEDIUM** — Regression risk for future changes.

- Zero tests for DealRepository (12 methods) or ContractRepository (14 methods)
- Zero tests for any of the 8 API routes
- Zero tests for UI components
- Established test pattern exists (`node:test` + `tsx` in contacts.test.ts, interactions.test.ts) but wasn't applied
- `package.json` has no test script defined

### Low: Large Page Components

- `app/contracts/[id]/page.tsx` at 732 lines — inline tabs, modals, editing logic
- `app/deals/[id]/page.tsx` at 489 lines
- No extraction into dedicated components under `components/contracts/` (directory exists but is empty)

### Low: Hardcoded IDs

- `"current-user-id"` placeholder in API routes for `changedBy` fields
- `"default-pipeline-id"` in seed scripts
- These are deferred to auth integration (NextAuth already configured)

---

## 3. Duplicate Milestone: M003 / M009

**Finding:** Two milestone directories exist for the same work:
- `.gsd/milestones/M003/` — full artifacts (CONTEXT, SUMMARY, VALIDATION, ROADMAP, all 5 slices)
- `.gsd/milestones/M009/` — mirror artifacts with identical content

PROJECT.md lists M009 as the Deals and Contracts milestone, but M003-CONTEXT.md also describes the same milestone. Both have the same `completed_at` timestamp (2026-06-21T13:22:33.755Z).

**Impact:** Confusion for roadmap planning. Future milestones may reference the wrong ID.

**Recommendation:** Consolidate to one ID. M009 appears to be the canonical ID per PROJECT.md. The M003 directory should be marked as superseded or removed.

---

## 4. Requirements Analysis

### R011 (Deals) — Validated
- Complete implementation: Pipeline (8 stages), Deal CRUD, Kanban, DealHistory
- Pattern: Repository + API routes + typed API client
- **Gap noted in spec but not implemented:** Pipeline customization (user-defined stages) is explicitly out of scope per CONTEXT.md. This may surface as a requirement if users need custom pipelines.

### R012 (Contracts) — Validated
- Complete implementation: Contract CRUD, versioning, signers, Deal→Contract conversion
- **Gap:** No PDF generation (out of scope for M003, but spec doc `docs/08-module-contracts.md` describes a full PDF pipeline with Handlebars-like templates). This is a significant deferred feature.
- **Gap:** Contract status workflow is only draft (spec describes draft → sent → signed → active → completed → cancelled/expired)

### Candidate Requirements (Advisory)

These findings are NOT requirements yet — they are observations for roadmap planners:

1. **Contract lifecycle state machine** — Currently only "draft" status. The spec (`docs/08-module-contracts.md`) defines 6 lifecycle states. Without a state machine, contract tracking is incomplete. This naturally belongs in a follow-up milestone or as a contract enhancement slice.

2. **PDF generation from contract templates** — Spec describes Handlebars-like template system with variables. This is a substantial feature involving template rendering, PDF generation (puppeteer or similar), and file storage (MinIO). Worth its own slice or milestone.

3. **Kanban pagination/virtualization** — Currently loads all deals. At 100+, may need pagination or virtualization (react-window, react-virtuoso).

---

## 5. Integration Points for Future Milestones

### M004 (Projects)
- `Deal.projectId` and `Contract.dealId` → `Project.contractId` chain already exists in schema
- Deal → Contract → Project conversion flow is partially built (Deal→Contract works)
- Project creation from contract can reuse the `convertFromDeal` pattern

### M005 (Procurement)
- No direct schema links to deals/contracts in current schema
- Procurement may need to reference contracts for supplier agreements

### M006 (Finance)
- `Contract.amount` and `Deal.amount` provide revenue data for budgets/transactions
- Finance dashboards should aggregate deal pipeline values and contract amounts

### M008 (Notifications)
- Stage transitions (moveStage) are natural notification triggers
- Contract status changes should notify stakeholders
- DealHistory entries could generate in-app notifications

---

## 6. Patterns Established (Reuse for M004-M008)

| Pattern | Example | Notes |
|---------|---------|-------|
| Repository singleton | `export const deals = new DealRepository()` | Use for all new domain entities |
| API route structure | GET/POST /api/resource, GET/PATCH/DELETE /api/resource/[id] | Consistent URL scheme |
| List + detail page | `/deals` list, `/deals/[id]` detail | Apply to projects, procurement, finance |
| Loading/error/empty states | All async components have three-state rendering | Mandatory for new pages |
| Timeline components | DealHistoryTimeline reuses InteractionTimeline pattern | For any entity with chronological events |
| Soft delete | `deletedAt` timestamp, filtered in all queries | Apply to all new domain entities |
| Auto-numbering | `X-YYYY-NNNNN` format with random suffix | Consider sequence-based for production |
| Drag-and-drop | `@dnd-kit/core` for Kanban | Reusable for any board/card UI |
| Tabbed detail pages | Contract detail with Details/Versions/Signers/Related tabs | For any complex entity with sub-resources |
| Sub-resource API routes | `/api/contracts/[id]/versions`, `/api/contracts/[id]/signers` | Nested resource pattern |

---

## 7. Open Questions (from CONTEXT.md)

1. **Pagination on Kanban:** Currently loads all deals. For 100+ deals, either server-side pagination or client-side virtualization needed. Decision deferred.

2. **Contract status workflow:** Only "draft" implemented. Spec defines 6 states. Should this be a state machine with transition rules?

3. **History timeline depth:** No limit on DealHistory entries. For deals with many stage changes, timeline could become very long. Should we limit to last N or add pagination?

---

## 8. Recommendations for Roadmap Planner

1. **Refactor contract pages** into dedicated components under `components/contracts/` before they grow further (732-line page component is a maintenance risk).

2. **Add transaction wrapping** to `moveStage` and `convertFromDeal` — low effort, prevents data inconsistency.

3. **Add test coverage** for repositories and API routes following the established `node:test` + `tsx` pattern.

4. **Resolve M003/M009 duplicate** — pick one canonical milestone ID and remove the other.

5. **Contract lifecycle** and **PDF generation** are the two largest deferred features from the spec. Plan them as dedicated slices in a follow-up milestone.

6. **Improve auto-numbering** before production — use a DB sequence or at least add retry logic for UNIQUE constraint violations.

---

## 9. Skill Recommendations

For future milestones building on these patterns:

- **react-best-practices** — already installed, useful for Kanban performance optimization and component extraction
- **api-design** — already installed, useful for designing Projects/Procurement/Finance API routes following the established pattern
- **decompose-into-slices** — already installed, useful for breaking M004-M008 into vertical slices
