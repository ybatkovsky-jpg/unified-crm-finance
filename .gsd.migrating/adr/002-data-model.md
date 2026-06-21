# ADR-002: Data Model Architecture — Prisma as Single Source of Truth, SQLAlchemy via Reflection

**Status:** Accepted
**Date:** 2026-06-21
**Context:** M001/S02 — Prisma schema implementation
**Related:** [ADR-001: Hybrid Architecture](001-architecture.md), [R009: ADR-02 requirement](../../REQUIREMENTS.md)

---

## Context

The unified CRM-finance system uses a hybrid architecture (ADR-001): Next.js with Prisma ORM for the primary web application, and Python FastAPI with SQLAlchemy for background workers. Both runtimes share the same PostgreSQL database.

This hybrid approach introduces a critical risk: **ORM divergence**. If Prisma and SQLAlchemy define models independently, schema changes in one may not propagate to the other, leading to:

- Runtime errors when Python workers query tables with changed/missing columns
- Data inconsistencies when ORMs interpret types differently (e.g., JSON vs JSONB, String[] vs text array)
- Migration conflicts when both tools try to own schema evolution
- Debugging nightmares when errors appear only in one runtime

Alternative approaches considered:

1. **Prisma-only in both runtimes** — Not viable; Prisma has no Python runtime
2. **SQLAlchemy-only** — Rejects Prisma's type-safe client and migration tooling benefits for TypeScript
3. **Separate databases** — Breaks transactional consistency between web app and workers
4. **Dual schema definition with sync** — Adds complexity; requires manual sync or code generation

## Decision

**Prisma `schema.prisma` is the single source of truth for database schema evolution.** SQLAlchemy uses `automap_base()` reflection to read the actual database structure at runtime, not declarative models defined in Python code.

### Schema Ownership Contract

| Aspect | Owner | Notes |
|--------|-------|-------|
| Schema definition | Prisma | `apps/web/prisma/schema.prisma` is canonical |
| Migrations | Prisma | `npx prisma migrate dev` generates SQL |
| TypeScript types | Prisma | Generated from schema (`@prisma/client`) |
| Python runtime | SQLAlchemy | Reflects schema via `automap_base()` |
| Write access | Prisma-first | Python workers write task results only |
| Read access | Both | Prisma queries from web, SQLAlchemy from workers |

### SQLAlchemy Integration Pattern

```python
# apps/worker/app/db.py
from sqlalchemy.ext.automap import automap_base
from sqlalchemy import create_engine

def get_reflected_base():
    """Reflect schema at runtime; no declarative models needed."""
    Base = automap_base()
    engine = create_engine(DATABASE_URL)
    Base.prepare(autoload_with=engine)
    return Base

# Usage:
Base = get_reflected_base()
User = Base.classes.User  # Mapped from actual "users" table
Contact = Base.classes.Contact
```

### Migration Flow

1. **Developer edits schema** → `apps/web/prisma/schema.prisma`
2. **Generate migration** → `npx prisma migrate dev --name feature_x`
3. **Apply to database** → SQL runs automatically via Prisma CLI
4. **Regenerate Prisma Client** → TypeScript types updated
5. **Python worker restart** → SQLAlchemy re-reflects schema via `automap_base()`

### Write Access Boundaries

- **Next.js web app** — Full CRUD via Prisma Client (primary data entry point)
- **Python workers** — Read-only for business logic, write-only for task results (e.g., AI parse results, email imports)
- **No direct schema changes in Python** — All model changes go through Prisma migrations

### Verification Strategy

M001/S05 includes type consistency verification:

```python
# Verify reflected models match expected structure
def verify_schema_consistency():
    Base = automap_base()
    Base.prepare(autoload_with=engine)
    assert hasattr(Base.classes, 'User')
    assert hasattr(Base.classes, 'Contact')
    # ... check critical bounded contexts
```

## Rationale

### Why Prisma as Source of Truth?

1. **Migration safety** — Prisma's migration history is version-controlled in `apps/web/prisma/migrations/`, enabling rollback and audit
2. **Type safety** — Generated TypeScript types prevent runtime errors in the primary web app
3. **Developer productivity** — Prisma Studio provides visual schema inspection; developers edit one file, not two
4. **Ecosystem** — Prisma has strong Next.js integration; declarative models feel natural for TypeScript

### Why SQLAlchemy Reflection Instead of Declarative?

1. **No duplication** — Declarative models would duplicate schema definition in Python, violating single source of truth
2. **Automatic sync** — `automap_base()` reads actual database structure; no manual model updates when Prisma schema changes
3. **Pythonic access** — Reflection provides Python ORM interface without boilerplate
4. **Worker use case fits** — Workers are read-mostly; reflection overhead at startup is acceptable

### Why Not Dual ORM Ownership?

- **Dual ownership risks divergence** — Two sources of schema truth will eventually conflict
- **Prisma migrations are not portable** — Prisma's migration format is JSON + SQL; not consumable by Alembic without translation
- **SQLAlchemy migration tooling (Alembic) is powerful but separate** — Adding Alembic would require sync logic anyway

## Alternatives Considered

### Alternative 1: Prisma-Only, No Python Workers

- **Pros:** Single language, single ORM, no divergence risk
- **Cons:** Loses Python ecosystem benefits (LangChain, pandas, heavy data processing libraries); workers would need to run in Node.js, which is less mature for AI/data tasks

### Alternative 2: SQLAlchemy-Only, Abandon Prisma

- **Pros:** Single ORM across runtimes, Python ecosystem everywhere
- **Cons:** Loses Prisma's type safety for Next.js; would need to write raw SQL queries or use a JavaScript ORM that doesn't match Prisma's developer experience

### Alternative 3: Separate Databases (Web DB vs Worker DB)

- **Pros:** Complete isolation, no schema coupling
- **Cons:** Breaks transactional consistency; workers couldn't update web app state directly; adds complexity for data synchronization

### Alternative 4: Code Generation from Prisma Schema to SQLAlchemy Models

- **Pros:** Declarative models in Python, IDE autocomplete
- **Cons:** Requires build step, adds complexity; still risks drift if generation isn't run after every schema change

## Consequences

### Positive

1. **Single source of truth** — `schema.prisma` is the only place to edit database structure
2. **Automatic sync** — SQLAlchemy reflects latest schema on worker restart; no manual model updates
3. **Migration safety** — Prisma's versioned migrations enable rollback and audit
4. **Type safety** — TypeScript generated types prevent runtime errors in web app
5. **Python ecosystem** — Workers retain access to LangChain, pandas, numpy for AI/data tasks

### Negative

1. **Worker restart required** — SQLAlchemy reflects schema at startup; workers must restart after Prisma migrations to see new columns
2. **No Python type hints** — Reflected classes lose IDE autocomplete; Python code uses `.attrs` or runtime inspection
3. **Debugging opacity** — SQLAlchemy errors reference reflected models, not Python definitions; stack traces are less clear
4. **Startup overhead** — `automap_base()` scans database on worker launch; adds ~100-500ms depending on schema size

### Mitigations

- **Worker restart automation** — Deploy scripts run `docker compose restart worker` after Prisma migrations
- **Type stubs (optional)** — Generate Python `.pyi` stubs from Prisma schema for IDE support if needed (deferred to post-M001)
- **Documentation** — This ADR documents the pattern; future developers understand the contract
- **Health checks** — Worker `/health` endpoint verifies database connectivity on startup; fails fast if schema is incompatible

## Trade-offs Summary

| Concern | Decision | Trade-off |
|---------|----------|-----------|
| Schema ownership | Prisma | Python runtime must reflect; no declarative models |
| Type safety in Python | None | IDE autocomplete limited; runtime inspection required |
| Migration safety | Prisma | Workers must restart after schema changes |
| Write access | Prisma-first | Python writes limited to task results |

## References

- **Prisma Schema** — `apps/web/prisma/schema.prisma` (canonical source)
- **ADR-001** — Hybrid architecture context for dual runtime approach
- **S05 Research** — SQLAlchemy async engine + automap_base() pattern for workers
- **R009** — Requirement for ADR-002 documentation
- **docs/05-data-model.md** — Full entity specifications (42 entities across 7 bounded contexts)

---

**Next Steps:**
1. S02 complete Prisma schema with all 42 entities
2. S05 implement SQLAlchemy `automap_base()` reflection in FastAPI worker
3. S05 add schema consistency verification to worker health checks
4. Post-M001: Evaluate Python type stub generation if IDE pain points emerge
