---
phase: closeout
phase_name: Milestone M003 Closeout
project: unified-crm-finance
generated: 2025-06-22T01:45:00.000Z
counts:
  decisions: 5
  lessons: 3
  patterns: 5
  surprises: 1
missing_artifacts: []
---

# M003 Learnings

## Decisions

- **Repository pattern for Deal and Contract entities** — Chose Repository pattern to separate business logic from data access, enable testing, and provide consistent API across domain models
  - Source: M003-ROADMAP.md/Architecture Decisions

- **Deal to Contract conversion with bidirectional link** — Chose convertFromDeal method in ContractRepository that creates Contract from Deal data and sets both deal.contractId and contract.dealId. Throws if contract already exists for deal.
  - Source: S04-SUMMARY.md/Key Decisions

- **Contract versioning via separate ContractVersion table** — Chose separate ContractVersion table with incremental version numbers. addVersion queries latest version number and increments by 1.
  - Source: S04-SUMMARY.md/Key Decisions

- **Soft-delete pattern for Deal and Contract** — Chose deletedAt nullable timestamp instead of physical row deletion. Repositories filter where deletedAt IS NULL by default; softDelete sets deletedAt = now()
  - Source: S04-SUMMARY.md/Key Decisions

- **Auto-numbering schemes for deals and contracts** — Chose С-YYYY-NNNNN for deals and Д-YYYY-NNNNN for contracts to provide user-friendly identifiers for cross-referencing
  - Source: S01-SUMMARY.md/What Happened

## Lessons

- **Transaction safety required for bidirectional link creation** — convertFromDeal must wrap deal and contract updates in prisma.$transaction to prevent orphaned contracts if deal update fails after contract creation
  - Source: S04-SUMMARY.md/What Happened

- **Same-stage move behavior documented deviation** — moveStage implementation records DealHistory entry with fromStageId==toStageId instead of rejecting. Tests verify actual behavior; not a blocker but different from original plan
  - Source: S01-SUMMARY.md/Deviations

- **Pagination gap in DealApiClient** — Pagination params (skip/take) declared in DealListParams type but not serialized by DealApiClient.url() method — deferred to future work
  - Source: S01-SUMMARY.md/Known Limitations

## Patterns

- **node:test pattern for unit tests** — Repository tests use real Prisma with in-memory setup (seed pipeline + stages + contact before each test); client tests use mocked fetch via undici MockAgent
  - Source: S01-SUMMARY.md/Patterns Established

- **Pipeline API for stage list** — Use pipeline API (GET /api/pipelines/[id]) for stage list instead of deriving from deals; ensures all 8 stages render even when empty
  - Source: S02-SUMMARY.md/Patterns Established

- **Return full relations from mutation APIs** — Return complete object with relations (stage, contact, manager, pipeline) from mutations to avoid stale UI state
  - Source: S02-SUMMARY.md/Patterns Established

- **onValueChange for Select components** — Use @base-ui/react Select with onValueChange prop instead of onChange; handle null values properly
  - Source: S02-SUMMARY.md/Key Decisions

- **Conditional display for Contact names** — Show firstName + lastName for person contacts, companyName for company contacts; type badge distinguishes entity type
  - Source: S02-SUMMARY.md/Key Decisions

## Surprises

- **@base-ui/react component API differences** — TypeScript compilation revealed Select component uses onValueChange not onChange, and DialogTrigger doesn't support asChild prop — had to fix during S02 completion
  - Source: S02-SUMMARY.md/Deviations
