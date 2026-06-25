---
estimated_steps: 1
estimated_files: 2
skills_used: []
---

# T04: Create lib/api/contacts.ts client helpers

Создать TypeScript-клиент для Contact API (fetch wrapper). Функции: getContacts(filter, pagination), getContact(id), createContact(data), updateContact(id, data), deleteContact(id). Типы из Prisma.Contact.

## Inputs

- `API routes из T03`

## Expected Output

- `lib/api/contacts.ts — клиентские функции`
- `lib/api/types.ts — типы запросов/ответов`

## Verification

tsx --test lib/api/contacts.test.ts (mock fetch или к реальному API)

## Observability Impact

Fetch ошибки логируются.
