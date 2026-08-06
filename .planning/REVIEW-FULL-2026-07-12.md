# Code Review: Полное ревью ERP «ПРО Мебель»

**Дата**: 2026-07-12
**Scope**: весь проект (`apps/web`, 343 исходных файла, ~27 000 строк кода)
**Методология**: 6 параллельных агентов: структура, безопасность, БД/API, фронтенд, БД-слой, тесты

---

## Quick Summary

| Severity | Count | Ключевые проблемы |
|----------|-------|-------------------|
| **CRITICAL** | 5 | Хардкод userId, имперсонация, гонка sequence, нет ErrorBoundary, нет тестов |
| **HIGH** | 8 | Непроверенные права на запись, TOCTOU-гонки, god-компоненты, filter mismatch |
| **MEDIUM** | 14 | Нет пагинации, N+1 запросы, слабые пароли, GET с сайд-эффектами |
| **LOW** | 10 | Нестандартизованные ответы API, дубликаты fetching, accessibility |

---

## CRITICAL Findings

### 1. [CRITICAL] Bug: Хардкод-заглушка currentUserId в deals/page.tsx

**Файл**: `apps/web/src/app/(app)/deals/page.tsx:101`

```typescript
const currentUserId = "current-user-id";  // line 101
```

Используется в `handleMoveDeal` (строка 81) как `changedBy: currentUserId`. Реальный ID пользователя никогда не подставляется. При каждом перемещении сделки в истории записывается строка `"current-user-id"`.

**Почему важно**: История сделок содержит невалидные ID пользователей. Аудит-лог перемещений сломан.

**Исправление**: Использовать `useMe()` хук или получать ID сессии с сервера.

---

### 2. [CRITICAL] Security: Имперсонация через POST /api/interactions

**Файл**: `apps/web/src/app/api/interactions/route.ts:55-120`

Эндпоинт **не вызывает** `getSession()` и принимает `body.authorId` напрямую от клиента. Любой авторизованный пользователь может создать взаимодействие от имени другого.

**Почему важно**: Позволяет подделку истории коммуникаций. Атакующий может создать фальшивые звонки/встречи от имени директора.

**Исправление**: Добавить `const session = await getSession()` и использовать `session.id` вместо `body.authorId`.

---

### 3. [CRITICAL] Race Condition: Дубликаты номеров проектов

**Файлы**: `apps/web/src/lib/db/projects.ts:158` + `apps/web/src/lib/db/sequence.ts:28-32`

`nextProjectNumber()` использует `count + 1` вне транзакции:

```typescript
export async function nextProjectNumber(branch: string): Promise<string> {
  const count = await prisma.project.count({ where: { branch } });
  const num = count + 1;  // ← гонка!
  return `ПМ${branch}-${String(num).padStart(4, '0')}`;
}
```

Комментарий говорит «Must be called within a Prisma transaction», но `create()` в `projects.ts` НЕ оборачивает вызов в транзакцию.

**Почему важно**: Два одновременных создания проекта дадут одинаковый `externalNumber`.

**Исправление**: Обернуть `create()` в `prisma.$transaction()` или использовать `findFirst` + `orderBy` с максимальным номером.

---

### 4. [CRITICAL] Frontend: Нет ErrorBoundary

**Файлы**: поиск по всем `.tsx` — 0 результатов `ErrorBoundary`

Ни один компонент не обёрнут в Error Boundary. Любое необработанное исключение рендеринга приводит к полному крашу React-дерева (белый экран).

**Почему важно**: Одна ошибка в любом компоненте ломает всё приложение.

**Исправление**: Добавить `<ErrorBoundary>` в корень `layout.tsx` и вокруг крупных фичевых секций.

---

### 5. [CRITICAL] Тесты: Покрытие ~2.2% (3 файла из 343)

**Файлы**: 3 тестовых файла на весь проект

| Область | Покрытие |
|---------|----------|
| API routes (100+) | 0% |
| DB repositories (25) | 4% (1 из 25) |
| Auth (8 модулей) | 12.5% (1 из 8) |
| UI pages/components (80+) | 0% |
| Middleware | 0% |
| Finance logic | 0% |

**Почему важно**: Критические пути (логин, транзакции, BOM, контракты) не имеют тестов. Регрессии не отлавливаются.

**Исправление**: Минимально покрыть тестами: auth (login/logout/jwt), deals CRUD, transactions CRUD, matching-engine.

---

## HIGH Findings

### 6. [HIGH] Security: Нет проверки сессии на запись в коллекции

**Файлы**: `POST /api/deals`, `POST /api/projects`, `POST /api/contacts`, `POST /api/contracts`, `POST /api/purchase-requests`, `POST /api/webhooks`

Эти эндпоинты полагаются только на middleware (блокирует неавторизованных), но не проверяют роли внутри. Любой авторизованный (включая `storekeeper`) может создавать сделки, проекты, договоры.

**Почему важно**: Нарушение ролевой модели. Кладовщик может создать проект.

**Исправление**: Добавить `requireDirector()` или `requireAdmin()` на мутирующие эндпоинты критичных сущностей.

---

### 7. [HIGH] Security: GET /api/transactions не вызывает getSession()

**Файл**: `apps/web/src/app/api/transactions/route.ts:27`

```typescript
import { getSession } from '../../../lib/auth/session';
// ...
export async function GET(request: NextRequest) {
  // getSession импортирован, но НИГДЕ не вызывается!
```

Любой авторизованный видит все транзакции, без фильтрации по ownership.

---

### 8. [HIGH] DB: TOCTOU-гонки в update()/softDelete() всех репозиториев

**Файлы**: `deals.ts`, `contacts.ts`, `transactions.ts`, `tasks.ts`, `projects.ts`

Паттерн: `findUnique` (проверка существования) → `update`/`delete` (запись) — два отдельных запроса. Между ними другая операция может изменить/удалить запись.

**Почему важно**: Потенциальная потеря данных или несогласованное состояние.

**Исправление**: Обернуть в `prisma.$transaction()` или использовать интерактивные транзакции.

---

### 9. [HIGH] DB: `transactions.countWithFilters()` игнорирует date-фильтры

**Файл**: `apps/web/src/lib/db/transactions.ts`

`findWithFilters()` применяет `dateFrom`/`dateTo`, а `countWithFilters()` — нет. При пагинации с фильтром по дате `totalCount` будет неверным.

---

### 10. [HIGH] Frontend: God-компоненты >1000 строк

| Компонент | Строк |
|-----------|-------|
| `deals/[id]/page.tsx` | 1300 |
| `projects/[id]/page.tsx` | 1111 |
| `procurement/bom-section.tsx` | 967 |
| `contracts/[id]/page.tsx` | 728 |

**Почему важно**: Невозможно поддерживать, тестировать, переиспользовать.

**Исправление**: Декомпозиция на фичевые подкомпоненты с чёткими пропсами.

---

### 11. [HIGH] DB: `tasks.findWithFilters()` — конфликт фильтров

**Файл**: `apps/web/src/lib/db/tasks.ts:73-78`

`overdueOnly` silently overwrites переданный `status` и игнорирует `dueBefore`. Вызывающий код может ожидать одного поведения, а получить другое.

---

### 12. [HIGH] Security: Нет rate-limiting на глобальном уровне

Только `/api/auth/login` имеет rate-limiter (in-memory, 5 попыток/мин). Все остальные эндпоинты не защищены от брутфорса/DoS.

---

### 13. [HIGH] DB: Жёсткое удаление в invoices.ts

**Файл**: `apps/web/src/lib/db/invoices.ts:144`

`InvoiceRepository.delete()` делает hard delete — в отличие от всех остальных репозиториев, использующих soft-delete.

---

## MEDIUM Findings

### 14. [MEDIUM] Missing Pagination
- `GET /api/invoices` — нет skip/take
- `GET /api/tasks` — нет skip/take
- `GET /api/purchase-requests` — нет skip/take
- `GET /api/analytics/funnel` — неограниченный nested include сделок

### 15. [MEDIUM] N+1 Queries
- `matching-engine.ts:46-50` — 4-5 запросов на каждую банковскую транзакцию в цикле
- `purchase-requests.ts:193-199` — `findUnique` на поставщика в цикле при группировке BOM

### 16. [MEDIUM] No Validation Library
- 0 зависимостей: ни Zod, ни Yup, ни Joi
- Вся валидация — ручные `if (!body.field)` проверки, дублируемые в каждом роуте
- `contact-form-modal.tsx:40`: комментарий «Inline validators (избегаем импорта из lib/validation — Turbopack)»

### 17. [MEDIUM] Weak Password Policy
- Минимальная длина: **4 символа**
- Нет требований к сложности (заглавные, цифры, спецсимволы)
- Сид-пароль: `admin123`
- Сброс пароля через `window.prompt()` (пароль виден на экране)

### 18. [MEDIUM] GET-запросы с сайд-эффектами
- `GET /api/tasks` — создаёт уведомления (`notifyTaskOverdue`), материализует шаблоны (`materializeInstances`)
- Нарушает REST-семантику и идемпотентность

### 19. [MEDIUM] No Request Body Size Limits
- Нигде нет проверки `Content-Length` перед `request.json()`
- Возможна атака многогигабайтным JSON

### 20. [MEDIUM] Security: RefreshToken не используется
- Модель `RefreshToken` есть в Prisma, но нигде не используется в коде
- Только один долгоживущий JWT (7 дней)

### 21. [MEDIUM] Inconsistent Pagination Contract
- `GET /api/deals`: `{ data, count, totalCount, page, pageSize, totalPages }`
- `GET /api/transactions`: `{ data, count }` (skip/take вместо page/pageSize)
- `GET /api/tasks`: `{ data, count }` (без пагинации вообще)

### 22. [MEDIUM] Frontend: Дубликат fetch useMe()
- `useMe()` вызывается и в Sidebar, и в Topbar
- Два одинаковых GET `/api/auth/me` при каждой навигации

### 23. [MEDIUM] Frontend: Молча проглоченные ошибки
- `deals/[id]/page.tsx:220`: `.catch(() => {})` — нет обратной связи пользователю
- Несколько мест с аналогичным паттерном

### 24. [MEDIUM] DB: Enum-значения как строки
- Все status/type поля — `String`, без нативных PostgreSQL enum или CHECK-ограничений
- Валидация только в коде приложения

### 25. [MEDIUM] Security: No MFA / 2FA
- Только однофакторная аутентификация (email + пароль)

### 26. [MEDIUM] Security: No CSRF Protection
- Только `sameSite: 'lax'` cookie
- Нет CSRF-токенов для мутирующих операций

### 27. [MEDIUM] Security: Нет аудит-лога событий входа
- Успешные/неудачные попытки входа не пишутся в `AuditLog`

---

## LOW Findings

### 28. [LOW] Frontend: Нет form-библиотеки
- 27 `useState` в `contact-form-modal.tsx` (545 строк)
- Ручная валидация дублируется в каждой форме
- Рекомендация: `react-hook-form` + `zod`

### 29. [LOW] Frontend: Нет data-fetching слоя
- Нет react-query / SWR / TanStack Query
- Нет кеширования, дедупликации, stale-while-revalidate

### 30. [LOW] Frontend: Accessibility
- Нет `aria-label` на иконках сайдбара
- Нет keyboard navigation для Kanban (только PointerSensor)
- Нет `aria-live` регионов
- Нет skip-to-content ссылки
- Login-форма использует сырые `<input>` без `htmlFor`

### 31. [LOW] Frontend: Нет skeleton-загрузок
- Только спиннеры, нет content-placeholder

### 32. [LOW] DB: 1524-строчный schema.prisma
- Все 57 моделей в одном файле — можно разбить по доменам

### 33. [LOW] API: Утечка внутренних ID
- `transactions.ts:138`: `Category with id ${data.categoryId} not found` — UUID уходит клиенту

### 34. [LOW] DB: Неуникальная генерация номеров сделок
- `deals.ts:53-56`: `Math.random()` + 5 цифр — возможны коллизии

### 35. [LOW] DB: `addMember()` не обрабатывает повторное добавление
- При повторном добавлении удалённого участника падает на unique constraint

### 36. [LOW] Frontend: `localStorage` напрямую в Sidebar
- Не SSR-safe (защищено `useEffect` + `mounted`, но хрупко)

### 37. [LOW] Security: In-memory rate limiter
- Сбрасывается при перезапуске сервера, не шарится между инстансами

---

## Positive Findings (Что сделано хорошо)

1. ✅ **Ноль SQL-инъекций** — 100% кода использует Prisma type-safe query builder
2. ✅ **Ноль XSS-рисков** — ни одного `dangerouslySetInnerHTML`, `innerHTML`, или `eval()`
3. ✅ **Хорошая структура API-клиентов** — типизированные классы, единый `ApiClientError`
4. ✅ **Чистый middleware** — JWT + section RBAC, проверка deactivated/deleted
5. ✅ **Продуманная обработка Prisma-ошибок** — P2002→409, P2003→400, P2025→404, русские сообщения
6. ✅ **Консистентные Decimal(15,2)** для всех денежных полей
7. ✅ **Soft-delete с индексами** `@@index([deletedAt])` на ключевых сущностях
8. ✅ **Правильный `$transaction()`** в `projects.completeWithCascade()` — лучший пример в кодовой базе
9. ✅ **Качественная документация** — 22 файла в `docs/`, PRODUCT-SPEC, ROADMAP
10. ✅ **Монорепо со структурой** — чёткое разделение: `lib/db/*`, `lib/api/*`, `lib/auth/*`, `components/*`
11. ✅ **IDOR-awareness** — комментарии «IDOR-fix» в notifications API
12. ✅ **JWT в httpOnly cookie** — токен недоступен JavaScript

---

## Рекомендованный порядок исправлений

### Неделя 1 (CRITICAL fixes)

1. **Исправить `currentUserId`** в `deals/page.tsx:101` — использовать `useMe()` или серверный ID
2. **Добавить ErrorBoundary** в корневой layout и вокруг крупных секций
3. **Исправить имперсонацию** в `POST /api/interactions` — добавить `getSession()`
4. **Обернуть `create()` проекта в транзакцию** для атомарной генерации `externalNumber`
5. **Добавить тесты** на login/logout и deals CRUD (min smoke tests)

### Неделя 2-3 (HIGH fixes)

6. **Добавить `getSession()`** во все мутирующие эндпоинты (deals, projects, contacts, webhooks)
7. **Исправить `GET /api/transactions`** — фактически вызывать `getSession()`
8. **Обернуть update/softDelete во всех репозиториях** в `$transaction`
9. **Исправить `countWithFilters()`** — добавить date-фильтры
10. **Декомпозировать** `deals/[id]/page.tsx` и `projects/[id]/page.tsx`
11. **Исправить конфликт фильтров** в `tasks.findWithFilters()`
12. **Добавить rate-limiting** на API (хотя бы per-user)

### Месяц 1-2 (MEDIUM/LOW improvements)

13. Внедрить `zod` для валидации API-схем
14. Добавить пагинацию на invoices, tasks, purchase-requests
15. Усилить парольную политику (min 8 символов, требования к сложности)
16. Внедрить `react-query` для кеширования и дедупликации запросов
17. Внедрить `react-hook-form` для форм
18. Убрать сайд-эффекты из GET /api/tasks
19. Добавить проверку Content-Length для защиты от oversized payloads
20. Реализовать RefreshToken или сократить TTL access-токена
21. Стандартизовать контракт пагинации

---

**Review complete.** Всего проанализировано: 343 исходных файла, ~27 000 строк кода, 50+ API эндпоинтов, 57 моделей БД, 80+ UI компонентов.
