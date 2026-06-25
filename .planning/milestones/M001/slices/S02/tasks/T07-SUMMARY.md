---
id: T07
parent: S02
milestone: M001
key_files:
  - .gsd/adr/002-data-model.md
key_decisions:
  - Prisma schema.prisma is single source of truth; no declarative SQLAlchemy models
  - SQLAlchemy uses automap_base() for reflection to avoid schema duplication
  - Workers must restart after Prisma migrations to re-reflect schema
  - Python write access limited to task results; primary CRUD via Prisma
duration: 
verification_result: passed
completed_at: 2026-06-21T04:30:02.508Z
blocker_discovered: false
---

# T07: Created ADR-002 documenting Prisma + SQLAlchemy consistency strategy with automap_base() reflection pattern

**Created ADR-002 documenting Prisma + SQLAlchemy consistency strategy with automap_base() reflection pattern**

## What Happened

Created ADR-002 at `.gsd/adr/002-data-model.md` documenting the data model architecture for the hybrid Prisma + SQLAlchemy system. The ADR establishes:

1. **Single source of truth**: Prisma `schema.prisma` owns schema evolution
2. **SQLAlchemy reflection**: Python workers use `automap_base()` to read database structure at runtime, not declarative models
3. **Migration flow**: Prisma migrate dev → SQLAlchemy re-reflects on worker restart
4. **Write boundaries**: Next.js web app has full CRUD; Python workers are read-mostly, write-only for task results
5. **Verification**: S05 will include schema consistency checks

The ADR includes:
- Context explaining the ORM divergence risk in hybrid architecture
- Decision with schema ownership contract table
- SQLAlchemy integration code example
- Rationale for choosing Prisma as source of truth and reflection over declarative models
- Alternatives considered (Prisma-only, SQLAlchemy-only, separate databases, code generation)
- Consequences (positive/negative) with mitigations
- References to schema file, ADR-001, S05 research, R009, and data model spec

Verification passed: ADR file exists with required sections (Context, Decision) and Prisma references.

## Verification

ADR-002 file created at `.gsd/adr/002-data-model.md` with all required sections:
- Context: Explains hybrid architecture ORM divergence risk
- Decision: Prisma as single source of truth, SQLAlchemy via automap_base() reflection
- Rationale: Justifies schema ownership and reflection pattern
- Alternatives: Analyzes 4 alternative approaches
- Consequences: Documents positive/negative impacts with mitigations

Verification command passed: test -f .gsd/adr/002-data-model.md && grep -q "## Context" && grep -q "## Decision" && grep -q "Prisma"

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f .gsd/adr/002-data-model.md && grep -q "## Context" .gsd/adr/002-data-model.md && grep -q "## Decision" .gsd/adr/002-data-model.md && grep -q "Prisma" .gsd/adr/002-data-model.md && echo "All checks passed"` | 0 | pass | 250ms |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `.gsd/adr/002-data-model.md`
