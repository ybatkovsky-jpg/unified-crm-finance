# 14. API-контракты

## 14.1. Общие принципы

### 14.1.1. Базовый URL

Все эндпоинты доступны под префиксом `/api/v1/`. Будущие breaking changes — `/api/v2/` параллельно.

### 14.1.2. Формат обмена

- Запросы и ответы — JSON (`Content-Type: application/json; charset=utf-8`).
- Кодировка — UTF-8.
- Даты — ISO 8601 (например, `2026-06-19T13:45:00Z`).
- Денежные суммы — `number` (float), всегда в основной валюте системы (RUB по умолчанию).
- Идентификаторы — строки (UUID).

### 14.1.3. Аутентификация

- Все эндпоинты (кроме `/auth/*` и `/health`) требуют аутентификации.
- Поддерживается 2 метода:
  1. **JWT-сессия** — заголовок `Authorization: Bearer <token>`, токен из NextAuth `/api/auth/session`.
  2. **API-key** — заголовок `X-API-Key: <key>`, для интеграций (например, для внешних скриптов).

### 14.1.4. Пагинация

```
GET /api/v1/contacts?page=1&perPage=50&sortBy=createdAt&sortOrder=desc
```

Ответ:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 50,
    "total": 1234,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 14.1.5. Фильтры

- Передаются в query string: `?status=active&managerId=uuid&createdAt[gte]=2026-01-01`.
- Операторы: `eq` (по умолчанию), `ne`, `gt`, `gte`, `lt`, `lte`, `in` (через запятую), `like`.
- Пример: `?amount[gte]=100000&status[in]=active,on_hold`.

### 14.1.6. HTTP-коды

| Код | Когда |
|-----|-------|
| 200 OK | Успешный GET, PUT |
| 201 Created | Успешный POST (создание) |
| 204 No Content | Успешный DELETE |
| 400 Bad Request | Невалидный запрос (отсутствует обязательное поле, неверный формат) |
| 401 Unauthorized | Не передан токен или токен невалиден |
| 403 Forbidden | Роль не имеет прав на действие |
| 404 Not Found | Сущность не найдена |
| 409 Conflict | Дубликат (например, контакт с таким ИНН уже есть) |
| 422 Unprocessable Entity | Бизнес-валидация не прошла (например, нельзя перейти на стадию из-за блокера) |
| 429 Too Many Requests | Rate limit превышен |
| 500 Internal Server Error | Внутренняя ошибка сервера |

### 14.1.7. Формат ошибок

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Поле 'amount' обязательно",
    "details": {
      "field": "amount",
      "rule": "required"
    },
    "requestId": "req_abc123"
  }
}
```

Коды ошибок:

| Код | Значение |
|-----|----------|
| `VALIDATION_ERROR` | Ошибка валидации ввода |
| `UNAUTHORIZED` | Не аутентифицирован |
| `FORBIDDEN` | Нет прав |
| `NOT_FOUND` | Сущность не найдена |
| `CONFLICT` | Конфликт (дубликат) |
| `BUSINESS_RULE_VIOLATION` | Нарушение бизнес-правила (например, Kanban guardrail) |
| `RATE_LIMIT_EXCEEDED` | Превышен лимит запросов |
| `EXTERNAL_SERVICE_ERROR` | Ошибка внешнего сервиса (LLM, email, банк) |
| `INTERNAL_ERROR` | Внутренняя ошибка |

### 14.1.8. Idempotency

POST/PUT/DELETE с заголовком `Idempotency-Key: <uuid>` — гарантирует, что повторный запрос с тем же ключом не создаст дубликат. Сервер кеширует результат на 24 часа.

### 14.1.9. Версионирование

- URL-версионирование: `/api/v1/`.
- Обратная совместимость: новые поля можно добавлять, удаление/переименование — только в новой версии.

### 14.1.10. Rate limiting

- По умолчанию: 100 запросов в минуту на пользователя.
- На auth-эндпоинты: 5 запросов в минуту на IP.
- При превышении — `429 Too Many Requests` с заголовком `Retry-After: <seconds>`.

## 14.2. Аутентификация и пользователи

### 14.2.1. Логин

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}

Response 200:
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "roles": ["manager"],
    "avatarUrl": null
  }
}

Response 401:
{ "error": { "code": "UNAUTHORIZED", "message": "Неверный email или пароль" } }
```

### 14.2.2. Обновление токена

```
POST /api/v1/auth/refresh
{ "refreshToken": "eyJ..." }

Response 200:
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### 14.2.3. Выход

```
POST /api/v1/auth/logout
Authorization: Bearer <token>

Response 204
```

### 14.2.4. Текущий пользователь

```
GET /api/v1/auth/me
Authorization: Bearer <token>

Response 200:
{
  "user": { ... },
  "permissions": ["deal:read", "deal:create", "contract:sign", ...]
}
```

### 14.2.5. Управление пользователями (admin only)

```
GET    /api/v1/users                — список
POST   /api/v1/users                — создание { email, name, password, roles }
GET    /api/v1/users/:id            — карточка
PUT    /api/v1/users/:id            — обновление
DELETE /api/v1/users/:id            — деактивация (soft)
POST   /api/v1/users/:id/reset-password — сброс пароля
```

## 14.3. CRM (Контакты)

### 14.3.1. Список контактов

```
GET /api/v1/contacts?page=1&perPage=50&type=company&sourceId=uuid&sortBy=createdAt&sortOrder=desc

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "type": "company",
      "companyName": "ООО «Ромашка»",
      "inn": "7701234567",
      "kpp": "770101001",
      "email": "info@romashka.ru",
      "phone": "+74951234567",
      "address": "г. Москва, ул. Ленина, 1",
      "source": { "id": "uuid", "code": "call", "name": "Звонок" },
      "owner": { "id": "uuid", "name": "Иван Иванов" },
      "status": "active",
      "tags": ["VIP", "оптовик"],
      "createdAt": "2026-06-01T10:00:00Z",
      "updatedAt": "2026-06-19T13:45:00Z",
      "lastInteractionAt": "2026-06-15T14:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 14.3.2. Создание контакта

```
POST /api/v1/contacts
{
  "type": "company",
  "companyName": "ООО «Ромашка»",
  "inn": "7701234567",
  "kpp": "770101001",
  "email": "info@romashka.ru",
  "phone": "+74951234567",
  "address": "г. Москва, ул. Ленина, 1",
  "sourceId": "uuid",
  "ownerId": "uuid",
  "tags": ["VIP"],
  "notes": "Крупный оптовый клиент"
}

Response 201:
{ "id": "uuid", ... }

Response 409:
{
  "error": {
    "code": "CONFLICT",
    "message": "Контакт с ИНН 7701234567 уже существует",
    "details": { "existingContactId": "uuid" }
  }
}
```

### 14.3.3. Объединение контактов

```
POST /api/v1/contacts/merge
{
  "primaryId": "uuid-1",
  "secondaryId": "uuid-2"
}

Response 200:
{
  "mergedContactId": "uuid-1",
  "transferredRelations": {
    "deals": 3,
    "interactions": 12,
    "contracts": 1,
    "projects": 2
  }
}
```

## 14.4. Сделки

### 14.4.1. Создание сделки

```
POST /api/v1/deals
{
  "title": "Поставка мебели для офиса",
  "contactId": "uuid",
  "pipelineId": "uuid",
  "stageId": "uuid",
  "amount": 500000,
  "currency": "RUB",
  "expectedCloseDate": "2026-07-15",
  "managerId": "uuid",
  "description": "Офис 200 м², 15 рабочих мест"
}

Response 201:
{
  "id": "uuid",
  "number": "С-2026-00042",
  "title": "Поставка мебели для офиса",
  ...
}
```

### 14.4.2. Перемещение по стадии

```
POST /api/v1/deals/:id/move
{
  "toStageId": "uuid",
  "comment": "Клиент согласовал КП"
}

Response 200:
{
  "deal": { ... },
  "historyEntry": {
    "id": "uuid",
    "fromStage": "КП",
    "toStage": "Переговоры",
    "changedAt": "2026-06-19T14:00:00Z",
    "changedBy": "uuid"
  }
}

Response 422 (если переход запрещён):
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Нельзя пропустить стадию «Квалификация»",
    "details": { "rule": "no_skip_stages" }
  }
}
```

### 14.4.3. Конвертация в договор

```
POST /api/v1/deals/:id/convert-to-contract
{
  "templateId": "uuid",
  "amount": 500000,
  "startDate": "2026-07-01",
  "endDate": "2026-09-30"
}

Response 201:
{
  "contract": {
    "id": "uuid",
    "number": "Д-2026-00012",
    ...
  },
  "deal": { "contractId": "uuid", "stage": { "code": "won", "isWonStage": true } }
}
```

## 14.5. Договоры

### 14.5.1. Генерация PDF

```
POST /api/v1/contracts/:id/generate-pdf
{
  "variables": {
    "signer.client.name": "Петров П.П.",
    "signer.client.position": "Генеральный директор"
  }
}

Response 201:
{
  "version": {
    "id": "uuid",
    "version": 3,
    "generatedPdfFileId": "uuid",
    "downloadUrl": "https://...s3.amazonaws.com/...signed-url..."
  }
}
```

### 14.5.2. Загрузка скана

```
POST /api/v1/contracts/:id/upload-scan
Content-Type: multipart/form-data

file: <binary>

Response 201:
{
  "file": {
    "id": "uuid",
    "filename": "contract_signed.pdf",
    "size": 234567,
    "mimeType": "application/pdf"
  }
}
```

## 14.6. Проекты

### 14.6.1. Смена этапа с guardrails

```
POST /api/v1/projects/:id/move
{
  "toStageCode": "production",
  "comment": "Все позиции доставлены"
}

Response 422 (если есть блокеры):
{
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "Нельзя перейти на этап «Производство»: есть незакрытые позиции",
    "details": {
      "blockers": [
        { "bomItemId": "uuid", "name": "Профиль алюминиевый 3м", "status": "ordered" },
        { "bomItemId": "uuid", "name": "Петля накладная", "status": "pending" }
      ],
      "canOverride": true
    }
  }
}
```

```
POST /api/v1/projects/:id/move
{
  "toStageCode": "production",
  "comment": "Owner разрешил переход с нехваткой",
  "ignoreBlockers": true
}

Response 200:
{ "project": { "stage": { "code": "production" } } }
```

## 14.7. Закупки

### 14.7.1. Загрузка BOM (Excel)

```
POST /api/v1/projects/:id/bom/upload
Content-Type: multipart/form-data

file: <binary Excel>

Response 202 (Accepted):
{
  "bomId": "uuid",
  "fileId": "uuid",
  "taskId": "uuid",
  "status": "parsing",
  "pollUrl": "/api/v1/bom/uuid/status"
}
```

Poll:

```
GET /api/v1/bom/:bomId/status

Response 200:
{
  "bomId": "uuid",
  "status": "parsed",
  "itemsCount": 145,
  "suppliersDetected": 8,
  "warnings": ["3 позиции без поставщика"]
}
```

### 14.7.2. Создание заявки на согласование

```
POST /api/v1/approvals
{
  "type": "payment",
  "entityId": "uuid-of-invoice",
  "amount": 250000,
  "comment": "Счёт от ООО «МеталлПрофиль» по проекту ПМ-2026-00012"
}

Response 201:
{
  "id": "uuid",
  "status": "pending",
  "requestedBy": "uuid",
  "requestedAt": "2026-06-19T14:00:00Z"
}
```

### 14.7.3. Согласование

```
POST /api/v1/approvals/:id/approve
{
  "comment": "Оплатить до 25.06"
}

Response 200:
{
  "id": "uuid",
  "status": "approved",
  "decidedBy": "uuid",
  "decidedAt": "2026-06-19T15:00:00Z"
}
```

## 14.8. Финансы

### 14.8.1. Импорт 1С-клиент-банк

```
POST /api/v1/imports/1c-clientbank
Content-Type: multipart/form-data

file: <binary XML>

Response 200:
{
  "syncLogId": "uuid",
  "recordsTotal": 145,
  "recordsSynced": 145,
  "autoClassified": 98,
  "requiresManualClassification": 47,
  "errors": []
}
```

### 14.8.2. P&L отчёт

```
GET /api/v1/reports/pnl?period=2026-06&projectId=uuid

Response 200:
{
  "period": "2026-06",
  "project": { "id": "uuid", "name": "Офис ООО Ромашка" },
  "income": {
    "total": 500000,
    "byCategory": [
      { "category": "Выручка", "amount": 500000 }
    ]
  },
  "expense": {
    "total": 380000,
    "byCategory": [
      { "category": "Материалы", "amount": 250000 },
      { "category": "Подрядчики", "amount": 100000 },
      { "category": "Транспорт", "amount": 30000 }
    ]
  },
  "profit": 120000,
  "margin": 0.24
}
```

## 14.9. Уведомления

### 14.9.1. WebSocket (опционально)

```
WS /ws/notifications
Authorization: Bearer <token>

Server → Client:
{
  "type": "notification",
  "data": {
    "id": "uuid",
    "type": "deal_stage_changed",
    "title": "Сделка перешла на стадию «Переговоры»",
    "message": "Сделка С-2026-00042 «Поставка мебели для офиса»",
    "level": "info",
    "link": "/deals/uuid",
    "createdAt": "2026-06-19T14:00:00Z"
  }
}
```

### 14.9.2. Polling fallback

```
GET /api/v1/notifications/unread-count

Response 200:
{ "count": 5 }
```

## 14.10. Webhooks (внешние → unified)

Система может принимать webhook'и от внешних сервисов:

```
POST /api/v1/webhooks/bank/:apiKey
Content-Type: application/json

{
  "event": "payment_received",
  "transaction": {
    "amount": 500000,
    "payerInn": "7701234567",
    "date": "2026-06-19",
    "description": "Оплата по договору Д-2026-00012"
  }
}

Response 200:
{ "accepted": true, "matchedProjectId": "uuid" }
```

## 14.11. Webhooks (unified → внутренние)

Webhook'и от Next.js к Python-воркеру (через `X-Internal-Secret` заголовок):

```
POST /internal/ai/parse-bom
X-Internal-Secret: <env var>

{ "fileId": "uuid", "projectId": "uuid" }

Response 202: { "taskId": "uuid" }
```

```
POST /internal/notify
X-Internal-Secret: <env var>

{ "notificationId": "uuid" }

Response 200: { "queued": true }
```

## 14.12. Документация API

- OpenAPI 3.1 спецификация — автоматически генерируется и доступна по `/api/docs` (Swagger UI) и `/api/openapi.json`.
- Каждый эндпоинт имеет описание, параметры, примеры запросов и ответов.
- Документация доступна всем аутентифицированным пользователям.

## 14.13. Версионирование контрактов

- Несовместимые изменения (удаление поля, изменение типа) — только в новой major-версии (`/api/v2/`).
- Совместимые добавления (новое поле, новый эндпоинт) — в текущей версии, с пометкой в changelog.
- Deprecated-эндпоинты помечаются заголовком `Deprecation: true` и удаляются через 6 месяцев.
