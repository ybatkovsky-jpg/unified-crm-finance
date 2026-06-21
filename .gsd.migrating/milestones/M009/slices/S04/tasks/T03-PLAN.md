---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T03: Convert Deal to Contract

Добавить POST /api/deals/[id]/convert endpoint для конвертации сделки в контракт. Создаёт Contract с данными из Deal, связывает dealId, выставляет status='draft'.

## Inputs

- None specified.

## Expected Output

- `POST /api/deals/[id]/convert endpoint`
- `Конвертация: title→title, amount→amount, contactId→contactId, dealId→dealId`
- `После конвертации сделка имеет contractId`

## Verification

curl тест: создать сделку, конвертировать, проверить связку
