# T07: Create ADR-002 documenting Prisma + SQLAlchemy consistency

**Estimate:** 30m
**Files:** .gsd/adr/002-data-model.md
**Inputs:** .gsd/adr/001-architecture.md, docs/05-data-model.md
**Expected Output:** ADR-002 documenting ORM consistency strategy

## Description

Write ADR-002 at .gsd/adr/002-data-model.md documenting the data model architecture: Prisma as single source of truth for schema evolution, SQLAlchemy as read-mostly mirror for Python worker, migration consistency strategy, and verification approach. This decision record is critical for S05 (FastAPI worker) and long-term maintainability.

**Why:** Hybrid architecture (ADR-001) introduces risk of ORM divergence. ADR-002 establishes the contract: Prisma owns schema, SQLAlchemy reads via reflection. This prevents future conflicts and documents the approach for all developers.

## Steps

1. Create .gsd/adr/ directory if not exists
2. Create .gsd/adr/002-data-model.md
3. Include sections: Context, Decision, Rationale, Alternatives, Consequences
4. Document:
   - Prisma schema.prisma as single source of truth
   - SQLAlchemy uses `automap_base()` for reflection, not declarative models
   - Migration flow: Prisma migrate dev → SQLAlchemy re-reflects
   - Verification: S05 includes type consistency check
   - Write access: Python limited to task results, reads via views preferred
5. Reference ADR-001 and R009 (requirement for ADR-02)
6. Link to apps/web/prisma/schema.prisma as canonical source

## Verification

```bash
test -f .gsd/adr/002-data-model.md && \
grep -q "## Context" .gsd/adr/002-data-model.md && \
grep -q "## Decision" .gsd/adr/002-data-model.md && \
grep -q "Prisma" .gsd/adr/002-data-model.md
```

## Observability Impact

- ADR-002 provides reference for Python worker implementation (S05)
- Documents ORM boundaries for future developers
