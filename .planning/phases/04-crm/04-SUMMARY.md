# Phase 4: CRM (ядро) — Summary

**Completed:** 2026-06-29
**Requirements:** CRM-01, CRM-03, CRM-06, CRM-07
**Deferred:** CRM-04 (→Phase 10), CRM-05 (→Phase 5), CRM-08 (→Phase 8)

## What was built

### CRM-01: Lead sources (канонический список)
- Added `Deal.sourceId` FK → `LeadSource`, `Project↔Deal` relation in schema.
- Updated `seed.ts`: 10 canonical sources (2ГИС/сайт/интернет/Instagram/ВК/TG-группа/офис/сарафан/старая база/дизайнер). Old codes deprecated (`isActive:false`).
- API `GET /api/lead-sources`, client `lib/api/lead-source.ts`, types `LeadSourceData`.
- UI: `<Select>` in create-deal-modal; badge in deal detail header + view mode; editable via PATCH.
- Routes: `POST /api/deals` and `PATCH /api/deals/[id]` accept `sourceId`.

### CRM-06: Loss reasons (обязательная причина отказа)
- `lib/loss-reasons.ts`: 5 static constants (too_expensive/competitor/changed_mind/lost_contact/other).
- `deals.moveStage` validates: if `isLostStage` → `lossReason` required, must match dictionary; else throw.
- `/move` route passes `lossReason`, maps validation errors to 400.
- Deal detail page shows readable label via `getLossReasonLabel`.

### CRM-07: Unified numbering + project/contract auto-creation
- `lib/db/sequence.ts`: `ПМ{YYYY}-{0001}` sequential per year, shared between project and contract.
- `projects.ts`: removed `PRJ-YYYY-{random}` generator → shared sequence.
- `contracts.ts`: `convertFromDeal` accepts optional shared number.
- New `POST /api/deals/[id]/convert-to-project`: atomic transaction creates project + contract with same `ПМ…` number, links both to deal, moves to «contract» stage.
- UI: unified «Создать проект и договор» button replacing separate «В проект»/«В контракт».

### CRM-03: Project deadline on deal card
- GET `/api/deals` includes `Project { id, endDate, externalNumber }`.
- `DealData.project` (ProjectLiteData) in types.
- `deal-card.tsx`: shows «N дн.» from project deadline (priority over expectedCloseDate).

## Files changed (~20)
`schema.prisma`, `seed.ts`, `lib/db/{sequence,deals,projects,contracts}.ts`, `lib/loss-reasons.ts`, `lib/api/{types,deals,lead-source}.ts`, routes: `api/deals/route.ts`, `api/deals/[id]/route.ts`, `api/deals/[id]/move/route.ts`, `api/deals/[id]/convert-to-project/route.ts` (new), `api/lead-sources/route.ts` (new), components: `create-deal-modal.tsx`, `deal-card.tsx`, `deals/[id]/page.tsx`, docs: `04-CONTEXT.md`, `04-PLAN.md`, `04-VERIFICATION.md`

## Next phase
Phase 5: Проект — спецификация и закупки (PROJ-01..07). This will need CRM-05 (КП с версионированием) which builds on BOM/spec from Phase 5.
