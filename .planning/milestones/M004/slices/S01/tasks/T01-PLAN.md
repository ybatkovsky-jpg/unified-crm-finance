---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T01: Create Production and ProductionStage Prisma models

Add Production and ProductionStage models to schema.prisma with proper relations, indexes, and cascade behavior.

## Inputs

- `apps/web/prisma/schema.prisma`

## Expected Output

- `Prisma migration applied`
- `Production model defined`
- `ProductionStage model defined`

## Verification

npx prisma migrate dev --name add_production
