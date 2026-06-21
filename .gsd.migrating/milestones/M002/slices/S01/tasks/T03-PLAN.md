---
estimated_steps: 4
estimated_files: 2
skills_used: []
---

# T03: Create Contact API routes (Next.js)

Создать API routes для Contact CRUD:
- app/api/contacts/route.ts (GET list, POST create)
- app/api/contacts/[id]/route.ts (GET, PUT, DELETE)

Валидация входных данных (type=person/company, обязательные поля). Возврат 201 на create, 200 на update, 204 на delete. Ошибки — 400/404/500.

## Inputs

- `lib/db/contacts.ts — ContactRepository`

## Expected Output

- `app/api/contacts/route.ts — список и создание`
- `app/api/contacts/[id]/route.ts — одиночный контакт`

## Verification

curl POST http://localhost:3000/api/contacts -d '{"type":"person","firstName":"Ivan","phone":"+79991234567"}' && curl GET http://localhost:3000/api/contacts

## Observability Impact

API ошибки логируются console.error.
