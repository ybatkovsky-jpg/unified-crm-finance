---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T03: Pipeline и DealStage seed данные

Создать seed скрипт для инициализации Pipeline с дефолтными стадиями. Файл apps/web/prisma/seed-deals.ts. Стадии: new, qualified, meeting, proposal, negotiation, contract, won, lost с correct order и probability.

## Inputs

- `apps/web/prisma/schema.prisma`

## Expected Output

- `seed-deals.ts создаёт Pipeline code='default'`
- `8 DealStage records с order 1-8`
- `isWonStage=true для won, isLostStage=true для lost`

## Verification

После запуска скрипта проверить через prisma studio
