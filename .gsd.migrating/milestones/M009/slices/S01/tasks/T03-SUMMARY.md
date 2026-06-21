---
id: T03
parent: S01
milestone: M009
key_files:
  - apps/web/prisma/seed-deals.ts
key_decisions: []
duration: 
verification_result: untested
completed_at: 2026-06-21T09:28:25.486Z
blocker_discovered: false
---

# T03: Seed скрипт создал default pipeline с 8 стадиями (new → won/lost)

**Seed скрипт создал default pipeline с 8 стадиями (new → won/lost)**

## What Happened

Создан seed скрипт apps/web/prisma/seed-deals.ts для инициализации Pipeline и DealStage. Стадии: new(10%), qualified(30%), meeting(50%), proposal(60%), negotiation(70%), contract(90%), won(100%, isWonStage=true), lost(0%, isLostStage=true). Скрипт проверяет существование default pipeline перед созданием. Запущен успешно через npx tsx prisma/seed-deals.ts, создан pipeline 'default' с 8 стадиями.

## Verification

Seed скрипт выполнился успешно. В БД создан Pipeline code='default' и 8 DealStage с правильным order, probability, isWonStage/isLostStage флагами.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| — | No verification commands discovered | — | — | — |

## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `apps/web/prisma/seed-deals.ts`
