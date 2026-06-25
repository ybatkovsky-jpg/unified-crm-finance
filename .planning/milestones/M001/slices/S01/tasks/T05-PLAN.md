---
estimated_steps: 3
estimated_files: 1
skills_used: []
---

# T05: Create ADR-01 documenting hybrid architecture

**Slice:** S01 — Монорепозиторий и Docker Compose
**Milestone:** M001

## Description

Document the decision to use hybrid Next.js API Routes + Python FastAPI architecture. This ADR captures the rationale per requirement R008.

## Steps

1. Create `.gsd/adr/001-hybrid-architecture.md`
2. Document: Context (zakuppro uses Python, finpro uses Next.js), Decision (hybrid: Next.js API Routes for main API, Python FastAPI for AI/background tasks), Rationale (minimize rewrite, keep typed end-to-end, leverage Python ecosystem), Alternatives considered (all Next.js, all Python), Consequences (two runtimes to maintain, shared database schema)
3. Use standard ADR template: Status, Context, Decision, Rationale, Alternatives, Consequences

## Must-Haves

- [ ] ADR-01 file exists in .gsd/adr/ directory
- [ ] All sections populated: Status, Context, Decision, Rationale, Alternatives, Consequences
- [ ] Documents the hybrid architecture decision

## Verification

```bash
test -f .gsd/adr/001-hybrid-architecture.md && grep -q 'Context' .gsd/adr/001-hybrid-architecture.md && grep -q 'Decision' .gsd/adr/001-hybrid-architecture.md && grep -q 'Rationale' .gsd/adr/001-hybrid-architecture.md
```

## Observability Impact

None - this is documentation only.

## Inputs

- `docs/02-current-systems.md` — context on existing systems (zakuppro Python, finpro Next.js)
- `docs/04-tech-stack.md` — confirms hybrid architecture choice
- `REQUIREMENTS.md` — R008 requires ADR-01 documentation

## Expected Output

- `.gsd/adr/001-hybrid-architecture.md` — architecture decision record
