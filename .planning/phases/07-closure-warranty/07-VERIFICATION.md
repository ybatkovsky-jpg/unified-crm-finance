# Phase 7 Verification

**Date:** 2026-06-29
**Requirements:** PROJ-12, PROJ-13, PROJ-14

## Type Check
- [x] `tsc --noEmit` — 0 ошибок (полный прогон, весь проект)

## API Smoke Tests (authed as director)
- [x] `GET /api/projects/[id]/closure-readiness` — возвращает чек-лист 4 условий с суммами:
  - act_signed: «Акт ещё не подписан» (false при отсутствии акта)
  - client_paid: «Получено 0 ₽, не хватает 150 000 ₽» (false, sum income < contractAmount)
  - supplier_invoices_paid: «Неоплаченных счетов нет» (true)
  - designer_bonus_paid: «Бонус не выплачен (или не заведён)» (false)
- [x] `POST /api/projects/[id]/acceptance-act` — создаёт акт с авто signerType=individual (contact.type=person)
- [x] `PATCH /api/acceptance-acts/[id]/sign` — переход draft→signed, проставляет signedAt, signMethod=paper
- [x] `PUT /api/projects/[id]/designer-bonus` — upsert с авто-расчётом amount=15000 (10% от 150000)
- [x] `PATCH /api/designer-bonuses/[id]/mark-paid` — переход pending→paid, проставляет paidAt
- [x] `GET closure-readiness` после акта+бонуса — act_signed=true, designer_bonus_paid=true
- [x] `POST /api/projects/[id]/complete` без override при невыполненных условиях → **409** с сообщением «Невыполненные условия закрытия: Все деньги клиента получены. Закройте с override...»

## UI Verification
- [x] Секция «Акт приёмки» на странице проекта: создание, статус, тип подписанта, диалог подписи (paper/edo)
- [x] Секция «Бонус дизайнеру»: сумма, процент, статус, mark-paid, диалог заведения
- [x] Карточка «Гарантия» в сайдбаре: даты + бейдж «На гарантии»/«Истекла»
- [x] Диалог закрытия: чек-лист readiness с детализацией, кнопки «Закрыть» / «Закрыть всё равно» при невыполненных условиях

## DB Migration
- [x] Миграция `phase7_acceptance_closure_warranty` применена (PostgreSQL)
- [x] Prisma client пересоздан
- [x] Back-relations User/FileEntity добавлены без конфликтов
