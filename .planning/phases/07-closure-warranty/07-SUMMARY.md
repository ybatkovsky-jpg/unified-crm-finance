# Phase 7: Акт, закрытие проекта, гарантия — Summary

**Completed:** 2026-06-29
**Requirements delivered:** PROJ-12, PROJ-13, PROJ-14 (3/3)

## What was done

### Schema (1 migration)
- New: `AcceptanceAct` (1:1 to Project) — status, signerType, signedById/At, signMethod, actFileId, notes
- New: `DesignerBonus` (1:1 to Project) — designerId, percent, amount, status, paidAt, notes
- `Project`: +`warrantyStartDate`, +`warrantyEndDate`, +`warrantyNotes`
- Back-relations: User (AcceptanceAct_SignedBy, DesignerBonus_Designer), FileEntity (AcceptanceAct_ActFile)

### New DB Repositories (3)
- `lib/db/acceptance-act.ts` — AcceptanceActRepository (CRUD + sign + auto signerType from Contact.type)
- `lib/db/designer-bonus.ts` — DesignerBonusRepository (upsert + markPaid + auto amount calc)
- `lib/db/projects.ts` extended — `getClosureReadiness()` (4-condition checklist)

### Extended DB Logic (1)
- `completeWithCascade(...)` — +`overrideUnmet` param (409 ConflictError when unmet without override), +warranty period (2 года) recording on completion

### New API Routes (6)
- `GET/POST /api/projects/[id]/acceptance-act`
- `PATCH/DELETE /api/acceptance-acts/[id]`
- `PATCH /api/acceptance-acts/[id]/sign`
- `GET/PUT /api/projects/[id]/designer-bonus`
- `PATCH /api/designer-bonuses/[id]/mark-paid`
- `GET /api/projects/[id]/closure-readiness`

### Extended API Routes (1)
- `POST /api/projects/[id]/complete` — +`overrideUnmet` body param, 409 on unmet conditions, readiness in response

### New API Clients (2)
- `lib/api/acceptance-act.ts` — AcceptanceActApiClient (get/create/update/sign/delete)
- `lib/api/designer-bonus.ts` — DesignerBonusApiClient (get/upsert/markPaid)

### Extended API Client (1)
- `lib/api/projects.ts` — +`getClosureReadiness()`, `completeProject()` extended with overrideUnmet

### New UI Components (2)
- `acceptance-act-card.tsx` — акт приёмки: статус, тип подписанта (авто), диалог подписи (paper/edo)
- `designer-bonus-card.tsx` — бонус: сумма, статус, кнопка mark-paid, диалог заведения (процент)

### Updated UI (1)
- `projects/[id]/page.tsx` — секции «Акт приёмки» + «Бонус дизайнеру», карточка «Гарантия» в сайдбаре, переделанный диалог закрытия (чек-лист readiness + soft-override flow)

### Shared
- `lib/api/types.ts` — AcceptanceActData, DesignerBonusData, ClosureReadiness/ClosureCondition types; ProjectData extended
- `components/layout/use-me.ts` — +`id` field (for act signing by current user)

## Key Design Decisions
1. **Auto signerType from Contact.type** — company→legal (менеджер), person→individual (монтажник); no manual mismatch allowed.
2. **Soft closure with override** — чек-лист 4 условий, но закрытие не блокируется жёстко; бэкенд 409 + UI «Закрыть всё равно».
3. **Minimal designer bonus** — per-project только; накопленный долг/история выплат отложены на FIN-06 (Phase 8).
4. **Warranty auto-recorded** — completedAt + 2 года проставляется при закрытии; фурнитура — заметкой.
5. **Idempotent act creation** — POST на существующий акт возвращает существующий (не дублирует).

## Model Count
- Было: 65 → Стало: 67 (+AcceptanceAct, +DesignerBonus)
