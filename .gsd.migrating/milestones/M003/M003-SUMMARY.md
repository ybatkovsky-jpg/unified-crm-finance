---
id: M003
title: "Сделки и контракты"
status: complete
completed_at: 2026-06-21T13:22:33.755Z
key_decisions:
  - Repository pattern for Deal and Contract entities
  - Auto-numbering: С-YYYY-NNNNN for deals, Д-YYYY-NNNNN for contracts
  - @dnd-kit for drag-and-drop (modern React standard)
  - Separate tables for ContractVersion and ContractSigner
  - Dedicated POST /move endpoint for stage transitions
  - Dedicated POST /convert endpoint for Deal→Contract
key_files:
  - apps/web/src/lib/db/deals.ts
  - apps/web/src/lib/db/contracts.ts
  - apps/web/src/app/api/deals/route.ts
  - apps/web/src/app/api/deals/[id]/move/route.ts
  - apps/web/src/app/api/contracts/route.ts
  - apps/web/src/app/api/contracts/[id]/versions/route.ts
  - apps/web/src/app/api/deals/[id]/convert/route.ts
  - apps/web/src/app/deals/page.tsx
  - apps/web/src/app/deals/[id]/page.tsx
  - apps/web/src/app/contracts/page.tsx
  - apps/web/src/app/contracts/[id]/page.tsx
  - apps/web/src/components/deals/kanban-board.tsx
  - apps/web/src/components/deals/deal-history-timeline.tsx
  - apps/web/src/components/ui/tabs.tsx
lessons_learned:
  - Post-validation integration gaps are common — Deal→Contract UI trigger was missing, fixed with button addition
  - Timeline components should follow established patterns — DealHistoryTimeline reused M002 InteractionTimeline pattern
  - Repository pattern with singleton export simplifies imports and provides consistent interface
  - Loading/error/empty state pattern should apply to all async components
---

# M003: Сделки и контракты

**Полноценный модуль управления продажами: воронка с drag-and-drop, история сделок, конвертация в контракт с версионностью и подписями**

## What Happened

Milestone M003 delivered a complete Deals and Contracts module. Five slices (S01-S05) implemented:

**S01 (Deal API):** DealRepository with CRUD operations, moveStage endpoint with DealHistory recording, auto-numbering С-YYYY-NNNNN, seed data for 8-stage pipeline.

**S02 (Deals UI):** Kanban board with @dnd-kit drag-and-drop between stages, filters, create modal, deal detail page.

**S03 (Deal Detail):** DealHistoryTimeline component showing stage changes with comments and timestamps, integrated into detail page.

**S04 (Contract API):** ContractRepository with versioning (ContractVersion) and signers (ContractSigner), convertFromDeal endpoint, auto-numbering Д-YYYY-NNNNN.

**S05 (Contracts UI):** Contracts list with filters, detail page with tabs (Details/Versions/Signers/Related), "В контракт" button added to deal detail page.

Post-validation fix closed the Deal→Contract UI integration gap. All success criteria verified: Kanban with drag-drop, visible history, one-click conversion, versioning, signers with dates.

## Success Criteria Results

| Criterion | Evidence | Verdict |
|-----------|----------|--------|
| Воронка сделок с drag-and-drop перемещением | S02: KanbanBoard with @dnd-kit/core, droppable zones per stage | ✅ PASS |
| История изменений сделки видна | S03: DealHistoryTimeline in deal detail page with fromStage→toStage, comments, timestamps | ✅ PASS |
| Конвертация сделки в контракт с одним кликом | S05: "В контракт" button in deal detail calls contractsApi.convertDeal, redirects to new contract | ✅ PASS |
| Контракт можно версионировать | S04: ContractRepository.addVersion with auto-increment; S05: Versions tab with add modal | ✅ PASS |
| Подписанты с датами подписания | S04: ContractSigner model with signedAt field; S05: Signers tab with add modal | ✅ PASS |

All 5 success criteria met.

## Definition of Done Results

| Item | Status |
|------|--------|
| All slices complete | ✅ 5/5 slices (S01-S05) complete with passing assessments |
| Slice summaries exist | ✅ All SUMMARY.md files present |
| Integrations work | ✅ S02→S03 (Kanban→detail), S03→S04 (Deal→Contract button), S04→S05 (API→UI) |
| Validation passed | ✅ M003-VALIDATION.md with verdict pass |

## Requirement Outcomes

| Requirement | Before | After | Evidence |
|-------------|--------|-------|----------|
| R011 — Модуль сделки | active (M003 inferred) | validated (M003) | Deal API + Kanban UI + history timeline |
| R012 — Модуль контракты | active (M003 inferred) | validated (M003) | Contract API + versions/signers + convert UI |

## Deviations

None.

## Follow-ups

None.
